/**
 * ChittyOS Canon - Source of truth and canonical data management
 * Manages the authoritative state and version control for distributed data
 */

import { nanoid } from 'nanoid'
import * as crypto from 'crypto'
import { ChittyID } from '../id'

export interface CanonicalRecord {
  id: string
  canonId: string
  version: number
  data: any
  schema?: string
  hash: string
  signature?: string
  chittyId: string
  timestamp: string
  previousHash?: string
  metadata?: {
    source: string
    tags: string[]
    ttl?: number
    immutable?: boolean
  }
}

export interface CanonConfig {
  endpoint?: string
  enableChain?: boolean
  enableSignatures?: boolean
  storageAdapter?: CanonStorageAdapter
}

export interface CanonStorageAdapter {
  get(canonId: string): Promise<CanonicalRecord | null>
  set(record: CanonicalRecord): Promise<void>
  delete(canonId: string): Promise<boolean>
  list(filter?: any): Promise<CanonicalRecord[]>
}

export interface CanonValidation {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

const DEFAULT_CONFIG: CanonConfig = {
  endpoint: process.env.CHITTY_CANON_ENDPOINT || 'https://canon.chitty.cc',
  enableChain: true,
  enableSignatures: true
}

let config = { ...DEFAULT_CONFIG }
const canonCache = new Map<string, CanonicalRecord>()
const chainIndex = new Map<string, CanonicalRecord[]>()

export function configure(customConfig: CanonConfig): void {
  config = { ...config, ...customConfig }
}

/**
 * Create a new canonical record
 */
export function createCanonical(
  data: any,
  chittyId: string,
  metadata?: CanonicalRecord['metadata']
): CanonicalRecord {
  const canonId = `CANON_${nanoid(21)}`
  const timestamp = new Date().toISOString()

  // Calculate data hash
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ data, chittyId, timestamp }))
    .digest('hex')

  const record: CanonicalRecord = {
    id: nanoid(),
    canonId,
    version: 1,
    data,
    hash,
    chittyId,
    timestamp,
    metadata: {
      source: metadata?.source || 'chittyos-core',
      tags: metadata?.tags || [],
      ttl: metadata?.ttl,
      immutable: metadata?.immutable || false
    }
  }

  // Store in cache
  canonCache.set(canonId, record)

  // Initialize chain if enabled
  if (config.enableChain) {
    chainIndex.set(canonId, [record])
  }

  return record
}

/**
 * Update a canonical record (creates new version)
 */
export function updateCanonical(
  canonId: string,
  data: any,
  chittyId: string
): CanonicalRecord | null {
  const existing = canonCache.get(canonId)

  if (!existing) {
    return null
  }

  if (existing.metadata?.immutable) {
    throw new Error('Cannot update immutable canonical record')
  }

  const timestamp = new Date().toISOString()
  const previousHash = existing.hash

  // Calculate new hash including previous hash for chain integrity
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ data, chittyId, timestamp, previousHash }))
    .digest('hex')

  const record: CanonicalRecord = {
    ...existing,
    id: nanoid(),
    version: existing.version + 1,
    data,
    hash,
    previousHash,
    chittyId,
    timestamp
  }

  // Update cache
  canonCache.set(canonId, record)

  // Update chain if enabled
  if (config.enableChain) {
    const chain = chainIndex.get(canonId) || []
    chain.push(record)
    chainIndex.set(canonId, chain)
  }

  return record
}

/**
 * Get canonical record by ID
 */
export async function getCanonical(canonId: string): Promise<CanonicalRecord | null> {
  // Check cache first
  if (canonCache.has(canonId)) {
    return canonCache.get(canonId)!
  }

  // Try storage adapter
  if (config.storageAdapter) {
    const record = await config.storageAdapter.get(canonId)
    if (record) {
      canonCache.set(canonId, record)
      return record
    }
  }

  // Try remote endpoint
  if (config.endpoint) {
    try {
      const response = await fetch(`${config.endpoint}/canon/${canonId}`)
      if (response.ok) {
        const record = await response.json() as CanonicalRecord
        canonCache.set(canonId, record)
        return record
      }
    } catch (error) {
      console.error('[Canon] Failed to fetch from endpoint:', error)
    }
  }

  return null
}

/**
 * Get version history for a canonical record
 */
export function getCanonicalHistory(canonId: string): CanonicalRecord[] {
  return chainIndex.get(canonId) || []
}

/**
 * Validate canonical record integrity
 */
export function validateCanonical(record: CanonicalRecord): CanonValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate structure
  if (!record.canonId || !record.canonId.startsWith('CANON_')) {
    errors.push('Invalid canon ID format')
  }

  if (!record.hash) {
    errors.push('Missing hash')
  }

  if (!record.chittyId) {
    errors.push('Missing ChittyID')
  }

  // Validate hash integrity
  const expectedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify({
      data: record.data,
      chittyId: record.chittyId,
      timestamp: record.timestamp,
      ...(record.previousHash && { previousHash: record.previousHash })
    }))
    .digest('hex')

  if (record.hash !== expectedHash) {
    errors.push('Hash mismatch - data integrity compromised')
  }

  // Validate chain integrity if previous hash exists
  if (record.previousHash && record.version > 1) {
    const history = getCanonicalHistory(record.canonId)
    const previousRecord = history[record.version - 2]

    if (previousRecord && previousRecord.hash !== record.previousHash) {
      errors.push('Chain integrity violation - previous hash mismatch')
    }
  }

  // Check TTL
  if (record.metadata?.ttl) {
    const age = Date.now() - new Date(record.timestamp).getTime()
    const ttlMs = record.metadata.ttl * 1000

    if (age > ttlMs) {
      warnings.push('Record has exceeded TTL')
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  }
}

/**
 * Sign a canonical record
 */
export function signCanonical(record: CanonicalRecord, privateKey: string): CanonicalRecord {
  if (!config.enableSignatures) {
    return record
  }

  const sign = crypto.createSign('SHA256')
  sign.update(record.hash)
  const signature = sign.sign(privateKey, 'base64')

  return {
    ...record,
    signature
  }
}

/**
 * Verify canonical record signature
 */
export function verifyCanonicalSignature(
  record: CanonicalRecord,
  publicKey: string
): boolean {
  if (!record.signature) {
    return false
  }

  try {
    const verify = crypto.createVerify('SHA256')
    verify.update(record.hash)
    return verify.verify(publicKey, record.signature, 'base64')
  } catch (error) {
    return false
  }
}

/**
 * Merge conflicting canonical records
 */
export function mergeCanonical(
  records: CanonicalRecord[],
  strategy: 'latest' | 'highest-version' | 'custom' = 'latest',
  customMerge?: (records: CanonicalRecord[]) => any
): CanonicalRecord {
  if (records.length === 0) {
    throw new Error('No records to merge')
  }

  if (records.length === 1) {
    return records[0]
  }

  let winner: CanonicalRecord

  switch (strategy) {
    case 'latest':
      winner = records.reduce((latest, record) =>
        new Date(record.timestamp) > new Date(latest.timestamp) ? record : latest
      )
      break

    case 'highest-version':
      winner = records.reduce((highest, record) =>
        record.version > highest.version ? record : highest
      )
      break

    case 'custom':
      if (!customMerge) {
        throw new Error('Custom merge function required')
      }
      const mergedData = customMerge(records)
      winner = createCanonical(
        mergedData,
        records[0].chittyId,
        { source: 'merge', tags: ['merged'] }
      )
      break

    default:
      winner = records[0]
  }

  // Add merge metadata
  return {
    ...winner,
    metadata: {
      ...winner.metadata,
      source: 'merge',
      tags: [...(winner.metadata?.tags || []), 'merged', `from-${records.length}-records`]
    }
  }
}

/**
 * Query canonical records
 */
export async function queryCanonical(filter: {
  chittyId?: string
  tags?: string[]
  source?: string
  afterTimestamp?: string
  beforeTimestamp?: string
}): Promise<CanonicalRecord[]> {
  let results: CanonicalRecord[] = []

  // Query from cache
  for (const record of canonCache.values()) {
    let matches = true

    if (filter.chittyId && record.chittyId !== filter.chittyId) {
      matches = false
    }

    if (filter.tags && filter.tags.length > 0) {
      const recordTags = record.metadata?.tags || []
      if (!filter.tags.every(tag => recordTags.includes(tag))) {
        matches = false
      }
    }

    if (filter.source && record.metadata?.source !== filter.source) {
      matches = false
    }

    if (filter.afterTimestamp && record.timestamp <= filter.afterTimestamp) {
      matches = false
    }

    if (filter.beforeTimestamp && record.timestamp >= filter.beforeTimestamp) {
      matches = false
    }

    if (matches) {
      results.push(record)
    }
  }

  // Query from storage adapter
  if (config.storageAdapter) {
    const storedRecords = await config.storageAdapter.list(filter)
    results = [...results, ...storedRecords]
  }

  // Remove duplicates
  const seen = new Set<string>()
  results = results.filter(record => {
    if (seen.has(record.canonId)) {
      return false
    }
    seen.add(record.canonId)
    return true
  })

  return results
}

/**
 * Clear canon cache
 */
export function clearCanonCache(): void {
  canonCache.clear()
  chainIndex.clear()
}

/**
 * Get canon statistics
 */
export function getCanonStats(): {
  totalRecords: number
  totalChains: number
  cacheSize: number
  oldestRecord?: string
  newestRecord?: string
} {
  let oldest: string | undefined
  let newest: string | undefined

  for (const record of canonCache.values()) {
    if (!oldest || record.timestamp < oldest) {
      oldest = record.timestamp
    }
    if (!newest || record.timestamp > newest) {
      newest = record.timestamp
    }
  }

  return {
    totalRecords: canonCache.size,
    totalChains: chainIndex.size,
    cacheSize: JSON.stringify([...canonCache.values()]).length,
    oldestRecord: oldest,
    newestRecord: newest
  }
}

export default {
  configure,
  createCanonical,
  updateCanonical,
  getCanonical,
  getCanonicalHistory,
  validateCanonical,
  signCanonical,
  verifyCanonicalSignature,
  mergeCanonical,
  queryCanonical,
  clearCanonCache,
  getCanonStats
}
/**
 * ChittyOS ID - Identity generation and management
 */

import { nanoid } from 'nanoid'
import * as crypto from 'crypto'

export interface ChittyID {
  id: string
  publicKey?: string
  privateKey?: string
  trustLevel: number
  createdAt: string
  metadata?: Record<string, any>
}

export interface ChittyIDConfig {
  endpoint?: string
  apiKey?: string
  generateKeys?: boolean
}

// Extend globalThis to include session context
declare global {
  var chittySessionId: string | undefined
}

const DEFAULT_CONFIG: ChittyIDConfig = {
  endpoint: process.env.CHITTY_ID_ENDPOINT || 'https://id.chitty.cc',
  apiKey: process.env.CHITTY_ID_API_KEY,
  generateKeys: true
}

let config = { ...DEFAULT_CONFIG }

export function configure(customConfig: ChittyIDConfig): void {
  config = { ...config, ...customConfig }
}

/**
 * REMOVED: ChittyCore does not generate ChittyIDs locally
 * All ChittyIDs must be requested from id.chitty.cc service
 * Use generate() or requestChittyID() instead
 */

/**
 * Request a ChittyID from the ChittyID service at id.chitty.cc
 * ChittyCore does not generate IDs - it requests them from the service
 */
export async function requestChittyID(metadata?: Record<string, any>): Promise<ChittyID> {
  if (!config.apiKey) {
    throw new Error('ChittyID request requires API key authentication to access id.chitty.cc service')
  }

  try {
    // Request ChittyID from the id.chitty.cc service
    const response = await fetch(`${config.endpoint}/api/pipeline/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        metadata,
        // Include session context for distributed sync
        sessionId: globalThis.chittySessionId || undefined
      })
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('ChittyID request failed: Invalid or expired API key for id.chitty.cc')
      }
      if (response.status === 403) {
        throw new Error('ChittyID request failed: Insufficient permissions for id.chitty.cc service')
      }
      throw new Error(`ChittyID service error: ${response.status} - ${response.statusText}`)
    }

    const result = await response.json() as ChittyID

    // Store session ID for cross-service sync if provided
    if (result.metadata?.sessionId) {
      globalThis.chittySessionId = result.metadata.sessionId
    }

    return result
  } catch (error) {
    // Re-throw all errors - no fallback in pipeline-only architecture
    throw error
  }
}

/**
 * Request a ChittyID from the id.chitty.cc service
 * ChittyCore does not generate IDs - it requests them from the service
 */
export async function generate(metadata?: Record<string, any>): Promise<ChittyID> {
  if (!config.endpoint) {
    throw new Error('ChittyID service endpoint not configured - set CHITTY_ID_ENDPOINT to id.chitty.cc')
  }

  // Request ChittyID from id.chitty.cc service
  return await requestChittyID(metadata)
}

/**
 * Verify a ChittyID signature
 */
export function verifySignature(
  chittyId: string,
  signature: string,
  data: string,
  publicKey: string
): boolean {
  try {
    const verify = crypto.createVerify('SHA256')
    verify.update(data)
    return verify.verify(publicKey, signature, 'base64')
  } catch (error) {
    return false
  }
}

/**
 * Sign data with a ChittyID private key
 */
export function signData(data: string, privateKey: string): string {
  const sign = crypto.createSign('SHA256')
  sign.update(data)
  return sign.sign(privateKey, 'base64')
}

/**
 * Validate ChittyID format
 */
export function isValidChittyID(id: string): boolean {
  return /^CID_[A-Za-z0-9_-]{21}$/.test(id)
}

/**
 * Parse ChittyID from various formats
 */
export function parseChittyID(input: string): string | null {
  // Direct ChittyID
  if (isValidChittyID(input)) return input

  // Extract from JWT or other tokens
  const cidMatch = input.match(/CID_[A-Za-z0-9_-]{21}/)
  if (cidMatch) return cidMatch[0]

  return null
}

/**
 * Validate a ChittyID via the pipeline validation endpoint
 */
export async function validateRemote(chittyId: string): Promise<boolean> {
  try {
    const response = await fetch(`${config.endpoint}/api/validate/${chittyId}`, {
      method: 'GET',
      headers: {
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    })

    if (response.ok) {
      const result = await response.json() as { valid: boolean }
      return result.valid === true
    }

    return false
  } catch (error) {
    console.warn('[ChittyID] Validation service unavailable, using local validation')
    return isValidChittyID(chittyId)
  }
}

/**
 * Get session context for distributed sync
 */
export function getSessionContext(): string | undefined {
  return globalThis.chittySessionId
}

/**
 * Set session context for distributed sync
 */
export function setSessionContext(sessionId: string): void {
  globalThis.chittySessionId = sessionId
}

export default {
  configure,
  generate,
  requestChittyID,
  validateRemote,
  verifySignature,
  signData,
  isValidChittyID,
  parseChittyID,
  getSessionContext,
  setSessionContext
}
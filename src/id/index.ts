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
 * Generate a new ChittyID locally
 */
export function generateLocal(): ChittyID {
  const chittyId: ChittyID = {
    id: `CID_${nanoid(21)}`,
    trustLevel: 0,
    createdAt: new Date().toISOString()
  }

  if (config.generateKeys) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })

    chittyId.publicKey = publicKey
    chittyId.privateKey = privateKey
  }

  return chittyId
}

/**
 * Generate a ChittyID via the ChittyID server
 */
export async function generateRemote(metadata?: Record<string, any>): Promise<ChittyID> {
  try {
    const response = await fetch(`${config.endpoint}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      body: JSON.stringify({ metadata })
    })

    if (!response.ok) {
      throw new Error(`ChittyID server error: ${response.status}`)
    }

    return await response.json() as ChittyID
  } catch (error) {
    console.warn('[ChittyID] Server unavailable, falling back to local generation')
    return generateLocal()
  }
}

/**
 * Generate a ChittyID (attempts remote, falls back to local)
 */
export async function generate(metadata?: Record<string, any>): Promise<ChittyID> {
  if (config.endpoint && config.apiKey) {
    return generateRemote(metadata)
  }
  return generateLocal()
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

export default {
  configure,
  generate,
  generateLocal,
  generateRemote,
  verifySignature,
  signData,
  isValidChittyID,
  parseChittyID
}
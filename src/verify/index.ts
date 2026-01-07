/**
 * ChittyOS Verify - Data verification and validation
 */

import { z, ZodSchema } from 'zod'
import * as crypto from 'crypto'

export interface VerifyConfig {
  strictMode?: boolean
  hashAlgorithm?: string
}

export interface VerificationResult {
  valid: boolean
  errors?: string[]
  warnings?: string[]
}

export interface SignedData {
  data: any
  signature: string
  timestamp: string
  chittyId?: string
}

const DEFAULT_CONFIG: VerifyConfig = {
  strictMode: false,
  hashAlgorithm: 'sha256'
}

let config = { ...DEFAULT_CONFIG }

export function configure(customConfig: VerifyConfig): void {
  config = { ...config, ...customConfig }
}

/**
 * Validate data against a Zod schema
 */
export function validateSchema<T>(
  data: unknown,
  schema: ZodSchema<T>
): VerificationResult & { data?: T } {
  try {
    const validated = schema.parse(data)
    return {
      valid: true,
      data: validated
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return {
      valid: false,
      errors: ['Validation failed']
    }
  }
}

/**
 * Common validation schemas
 */
export const schemas = {
  email: z.string().email(),

  chittyId: z.string().regex(/^CID_[A-Za-z0-9_-]{21}$/),

  uuid: z.string().uuid(),

  url: z.string().url(),

  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),

  dateTime: z.string().datetime(),

  ipAddress: z.string().ip(),

  semver: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/),

  strongPassword: z.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),

  jwt: z.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/),

  base64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/),

  hexColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),

  creditCard: z.string().regex(/^\d{13,19}$/).refine(luhnCheck, {
    message: 'Invalid credit card number'
  })
}

/**
 * Luhn algorithm for credit card validation
 */
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '')
  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Calculate hash of data
 */
export function hashData(data: any, algorithm = config.hashAlgorithm!): string {
  const stringData = typeof data === 'string' ? data : JSON.stringify(data)
  return crypto.createHash(algorithm).update(stringData).digest('hex')
}

/**
 * Verify data integrity using hash
 */
export function verifyIntegrity(data: any, expectedHash: string, algorithm = config.hashAlgorithm!): boolean {
  const actualHash = hashData(data, algorithm)
  return actualHash === expectedHash
}

/**
 * Create a signed data object
 */
export function signData(data: any, privateKey: string, chittyId?: string): SignedData {
  const timestamp = new Date().toISOString()
  const dataToSign = JSON.stringify({ data, timestamp })

  const sign = crypto.createSign('SHA256')
  sign.update(dataToSign)
  const signature = sign.sign(privateKey, 'base64')

  return {
    data,
    signature,
    timestamp,
    chittyId
  }
}

/**
 * Verify a signed data object
 */
export function verifySignedData(signedData: SignedData, publicKey: string): VerificationResult {
  try {
    const dataToVerify = JSON.stringify({
      data: signedData.data,
      timestamp: signedData.timestamp
    })

    const verify = crypto.createVerify('SHA256')
    verify.update(dataToVerify)
    const isValid = verify.verify(publicKey, signedData.signature, 'base64')

    return {
      valid: isValid,
      errors: isValid ? undefined : ['Invalid signature']
    }
  } catch (error) {
    return {
      valid: false,
      errors: ['Signature verification failed']
    }
  }
}

/**
 * Validate file checksum
 */
export async function validateChecksum(
  filePath: string,
  expectedChecksum: string,
  algorithm = 'sha256'
): Promise<boolean> {
  const fs = await import('fs')
  const stream = fs.createReadStream(filePath)
  const hash = crypto.createHash(algorithm)

  return new Promise((resolve, reject) => {
    stream.on('data', (data) => hash.update(data))
    stream.on('end', () => {
      const actualChecksum = hash.digest('hex')
      resolve(actualChecksum === expectedChecksum)
    })
    stream.on('error', reject)
  })
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  // Remove control characters
  let sanitized = input.replace(/[\x00-\x1F\x7F]/g, '')

  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')

  // Trim whitespace
  return sanitized.trim()
}

/**
 * Validate and sanitize JSON
 */
export function validateJSON(jsonString: string): VerificationResult & { data?: any } {
  try {
    const parsed = JSON.parse(jsonString)
    return {
      valid: true,
      data: parsed
    }
  } catch (error) {
    return {
      valid: false,
      errors: ['Invalid JSON: ' + (error as Error).message]
    }
  }
}

export default {
  configure,
  validateSchema,
  schemas,
  hashData,
  verifyIntegrity,
  signData,
  verifySignedData,
  validateChecksum,
  sanitizeInput,
  validateJSON
}
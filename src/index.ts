/**
 * ChittyOS Core - Essential package for all ChittyOS applications
 *
 * Provides:
 * - Beacon: Application tracking and monitoring
 * - ID: Identity generation and management
 * - Auth: Authentication and authorization
 * - Verify: Data verification and validation
 * - Brand: Consistent branding and theming
 * - Canon: Source of truth and canonical data management
 * - Registry: Service discovery and connection management
 * - ChittyChat: Messaging client connector
 */

import * as beacon from './beacon'
import * as id from './id'
import * as auth from './auth'
import * as verify from './verify'
import * as brand from './brand'
import * as canon from './canon'
import * as registry from './registry'
import * as chittychat from './chittychat'

// Re-export all modules
export { beacon, id, auth, verify, brand, canon, registry, chittychat }

// Export individual functions for convenience
export {
  // Beacon
  init as initBeacon,
  detectApp,
  sendBeacon,
  configure as configureBeacon
} from './beacon'

export {
  // ID
  generate as generateChittyID,
  generateLocal as generateLocalChittyID,
  generateRemote as generateRemoteChittyID,
  validateRemote as validateChittyID,
  isValidChittyID,
  parseChittyID,
  verifySignature as verifyChittySignature,
  signData as signWithChittyID,
  getSessionContext,
  setSessionContext
} from './id'

export {
  // Auth
  createToken,
  verifyToken,
  refreshToken,
  revokeSession,
  hasRoles,
  hasPermissions,
  hashPassword,
  verifyPassword
} from './auth'

export {
  // Verify
  validateSchema,
  schemas as validationSchemas,
  hashData,
  verifyIntegrity,
  signData,
  verifySignedData,
  sanitizeInput,
  validateJSON
} from './verify'

export {
  // Brand
  CHITTY_COLORS,
  CHITTY_THEME,
  BRAND_CONFIG,
  ASCII_LOGO,
  getCSSVariables,
  generateStyleTag,
  generateTailwindConfig
} from './brand'

export {
  // Canon
  createCanonical,
  updateCanonical,
  getCanonical,
  validateCanonical,
  mergeCanonical,
  queryCanonical
} from './canon'

export {
  // Registry
  getRegistry,
  registerService,
  connectToService,
  getService,
  getAllServices
} from './registry'

export {
  // ChittyChat
  getChittyChat
} from './chittychat'

// Export types
export type {
  // Beacon types
  BeaconConfig,
  AppInfo
} from './beacon'

export type {
  // ID types
  ChittyID,
  ChittyIDConfig
} from './id'

export type {
  // Auth types
  AuthConfig,
  AuthToken,
  AuthUser,
  AuthSession
} from './auth'

export type {
  // Verify types
  VerifyConfig,
  VerificationResult,
  SignedData
} from './verify'

export type {
  // Brand types
  BrandColors,
  BrandTheme
} from './brand'

export type {
  // Canon types
  CanonicalRecord,
  CanonConfig,
  CanonValidation
} from './canon'

export type {
  // Registry types
  ServiceEndpoint,
  ServiceConnection,
  ServiceHealth,
  RegistryConfig
} from './registry'

export type {
  // ChittyChat types
  ChittyChatConfig,
  Message
} from './chittychat'

// Default export with all modules
export default {
  beacon,
  id,
  auth,
  verify,
  brand,
  canon,
  registry,
  chittychat
}

// Auto-initialize beacon on import (can be disabled with CHITTY_BEACON_DISABLED=true)
if (typeof process !== 'undefined' && process.env.CHITTY_BEACON_DISABLED !== 'true') {
  beacon.init()
}

// Version
export const VERSION = '1.0.0'

// Print ASCII logo in development
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log(brand.ASCII_LOGO)
  console.log(`ChittyOS Core v${VERSION} initialized`)
}
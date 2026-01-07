/**
 * ChittyOS Auth - Authentication and authorization
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { nanoid } from 'nanoid'
import * as crypto from 'crypto'

export interface AuthConfig {
  jwtSecret?: string
  issuer?: string
  audience?: string
  expiresIn?: string
}

export interface AuthToken {
  token: string
  expiresAt: Date
  refreshToken?: string
}

export interface AuthUser {
  id: string
  chittyId?: string
  email?: string
  roles?: string[]
  permissions?: string[]
  metadata?: Record<string, any>
}

export interface AuthSession {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: Date
  createdAt: Date
}

const DEFAULT_CONFIG: AuthConfig = {
  jwtSecret: process.env.CHITTY_JWT_SECRET || crypto.randomBytes(32).toString('base64'),
  issuer: 'chittyos',
  audience: 'chittyos-apps',
  expiresIn: '24h'
}

let config = { ...DEFAULT_CONFIG }
const sessions = new Map<string, AuthSession>()

export function configure(customConfig: AuthConfig): void {
  config = { ...config, ...customConfig }
}

/**
 * Create a JWT token for a user
 */
export async function createToken(user: AuthUser): Promise<AuthToken> {
  const secret = new TextEncoder().encode(config.jwtSecret!)

  const expiresAt = new Date()
  const hours = parseInt(config.expiresIn?.replace('h', '') || '24')
  expiresAt.setHours(expiresAt.getHours() + hours)

  const token = await new SignJWT({
    sub: user.id,
    chittyId: user.chittyId,
    email: user.email,
    roles: user.roles || [],
    permissions: user.permissions || [],
    metadata: user.metadata || {}
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(config.issuer!)
    .setAudience(config.audience!)
    .setExpirationTime(config.expiresIn!)
    .setJti(nanoid())
    .sign(secret)

  const refreshToken = nanoid(32)

  // Store session
  const session: AuthSession = {
    id: nanoid(),
    userId: user.id,
    token,
    refreshToken,
    expiresAt,
    createdAt: new Date()
  }
  sessions.set(session.id, session)
  sessions.set(refreshToken, session)

  return {
    token,
    expiresAt,
    refreshToken
  }
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload & AuthUser> {
  try {
    const secret = new TextEncoder().encode(config.jwtSecret!)

    const { payload } = await jwtVerify(token, secret, {
      issuer: config.issuer!,
      audience: config.audience!
    })

    return {
      ...payload,
      id: payload.sub!,
      chittyId: payload.chittyId as string | undefined,
      email: payload.email as string | undefined,
      roles: payload.roles as string[] | undefined,
      permissions: payload.permissions as string[] | undefined,
      metadata: payload.metadata as Record<string, any> | undefined
    }
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Refresh an auth token
 */
export async function refreshToken(refreshToken: string): Promise<AuthToken> {
  const session = sessions.get(refreshToken)

  if (!session) {
    throw new Error('Invalid refresh token')
  }

  if (session.expiresAt < new Date()) {
    sessions.delete(session.id)
    sessions.delete(session.refreshToken)
    throw new Error('Session expired')
  }

  // Decode the old token to get user info
  const user = await verifyToken(session.token).catch(() => null)

  if (!user) {
    throw new Error('Cannot refresh token')
  }

  // Create new token
  return createToken({
    id: user.id,
    chittyId: user.chittyId,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    metadata: user.metadata
  })
}

/**
 * Revoke a session
 */
export function revokeSession(sessionId: string): boolean {
  const session = sessions.get(sessionId)

  if (session) {
    sessions.delete(session.id)
    sessions.delete(session.refreshToken)
    return true
  }

  return false
}

/**
 * Check if user has required roles
 */
export function hasRoles(user: AuthUser, requiredRoles: string[]): boolean {
  if (!user.roles) return false
  return requiredRoles.every(role => user.roles!.includes(role))
}

/**
 * Check if user has required permissions
 */
export function hasPermissions(user: AuthUser, requiredPermissions: string[]): boolean {
  if (!user.permissions) return false
  return requiredPermissions.every(perm => user.permissions!.includes(perm))
}

/**
 * Generate a secure password hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

/**
 * Clean up expired sessions
 */
export function cleanupSessions(): void {
  const now = new Date()

  for (const [key, session] of sessions) {
    if (session.expiresAt < now) {
      sessions.delete(key)
    }
  }
}

// Run cleanup every hour
setInterval(cleanupSessions, 3600000).unref()

export default {
  configure,
  createToken,
  verifyToken,
  refreshToken,
  revokeSession,
  hasRoles,
  hasPermissions,
  hashPassword,
  verifyPassword,
  cleanupSessions
}
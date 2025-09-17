/**
 * ChittyOS Beacon - Application tracking and monitoring
 */

import { nanoid } from 'nanoid'
import * as os from 'os'
import * as fs from 'fs'
import { execSync } from 'child_process'

export interface BeaconConfig {
  endpoint?: string
  interval?: number
  enabled?: boolean
  silent?: boolean
  appId?: string
  appName?: string
}

export interface AppInfo {
  id: string
  name: string
  version: string
  platform: string
  environment: string
  hostname: string
  nodeVersion: string
  os: string
  hasClaudeCode: boolean
  hasGit: boolean
  startedAt: string
  pid: number
  git?: {
    branch: string
    commit: string
    remote: string
  }
  chittyos?: {
    core: string
    modules: string[]
  }
}

const DEFAULT_CONFIG: BeaconConfig = {
  endpoint: process.env.CHITTY_BEACON_ENDPOINT || 'https://beacon.chitty.cc',
  interval: parseInt(process.env.CHITTY_BEACON_INTERVAL || '') || 300000,
  enabled: process.env.CHITTY_BEACON_DISABLED !== 'true',
  silent: process.env.CHITTY_BEACON_VERBOSE !== 'true'
}

let config = { ...DEFAULT_CONFIG }
let appInfo: AppInfo | null = null
let heartbeatInterval: NodeJS.Timeout | null = null

export function configure(customConfig: BeaconConfig): void {
  config = { ...config, ...customConfig }
}

export function detectApp(): AppInfo {
  const app: AppInfo = {
    id: generateAppId(),
    name: detectAppName(),
    version: detectVersion(),
    platform: detectPlatform(),
    environment: process.env.NODE_ENV || 'production',
    hostname: os.hostname(),
    nodeVersion: process.version,
    os: `${os.type()} ${os.release()}`,
    hasClaudeCode: detectClaudeCode(),
    hasGit: fs.existsSync('.git'),
    startedAt: new Date().toISOString(),
    pid: process.pid,
    chittyos: {
      core: '1.0.0',
      modules: detectChittyModules()
    }
  }

  // Add git info if available
  if (app.hasGit) {
    try {
      app.git = {
        branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim(),
        commit: execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(),
        remote: execSync('git remote get-url origin', { encoding: 'utf8' }).trim()
      }
    } catch (e) {
      // Ignore git errors
    }
  }

  return app
}

function generateAppId(): string {
  if (config.appId) return config.appId

  // Platform-specific IDs
  if (process.env.REPL_ID) return `replit-${process.env.REPL_ID}`
  if (process.env.GITHUB_REPOSITORY) return `github-${process.env.GITHUB_REPOSITORY.replace('/', '-')}`
  if (process.env.VERCEL_URL) return `vercel-${process.env.VERCEL_URL}`
  if (process.env.HEROKU_APP_NAME) return `heroku-${process.env.HEROKU_APP_NAME}`

  // Generate from package.json or create unique ID
  try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
    return `npm-${pkg.name}-${nanoid(8)}`
  } catch (e) {
    return `chitty-${nanoid()}`
  }
}

function detectAppName(): string {
  if (config.appName) return config.appName

  return process.env.CHITTY_APP_NAME ||
         process.env.REPL_SLUG ||
         process.env.GITHUB_REPOSITORY ||
         process.env.VERCEL_URL ||
         process.env.HEROKU_APP_NAME ||
         process.env.npm_package_name ||
         (() => {
           try {
             const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
             return pkg.name
           } catch (e) {
             return 'chittyos-app'
           }
         })()
}

function detectVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
    return pkg.version
  } catch (e) {
    return '0.0.0'
  }
}

function detectPlatform(): string {
  if (process.env.REPL_ID) return 'replit'
  if (process.env.GITHUB_ACTIONS) return 'github-actions'
  if (process.env.VERCEL) return 'vercel'
  if (process.env.NETLIFY) return 'netlify'
  if (process.env.RENDER) return 'render'
  if (process.env.HEROKU_APP_NAME) return 'heroku'
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws-lambda'
  if (process.env.GOOGLE_CLOUD_PROJECT) return 'google-cloud'
  if (process.env.WEBSITE_INSTANCE_ID) return 'azure'
  if (process.env.CF_PAGES) return 'cloudflare-pages'
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return 'cloudflare-workers'
  return 'unknown'
}

function detectClaudeCode(): boolean {
  return process.env.CLAUDE_CODE === 'true' ||
         fs.existsSync('.claude') ||
         fs.existsSync('CLAUDE.md') ||
         fs.existsSync('claude.json')
}

function detectChittyModules(): string[] {
  const modules: string[] = []

  try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    for (const dep of Object.keys(deps)) {
      if (dep.startsWith('@chittyos/') || dep.startsWith('@chittycorp/')) {
        modules.push(dep)
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return modules
}

export async function sendBeacon(event: string, data?: any): Promise<void> {
  if (!config.enabled) return

  const payload = {
    ...appInfo,
    event,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ...data
  }

  try {
    const response = await fetch(`${config.endpoint}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@chittyos/core/1.0.0'
      },
      body: JSON.stringify(payload)
    })

    if (!config.silent && !response.ok) {
      console.log(`[ChittyBeacon] Response: ${response.status}`)
    }
  } catch (error) {
    if (!config.silent) {
      console.log(`[ChittyBeacon] Error: ${(error as Error).message}`)
    }
  }
}

export function init(customConfig?: BeaconConfig): void {
  if (customConfig) {
    configure(customConfig)
  }

  if (!config.enabled) {
    if (!config.silent) {
      console.log('[ChittyBeacon] Disabled')
    }
    return
  }

  appInfo = detectApp()

  // Send startup beacon
  sendBeacon('startup')

  // Send periodic heartbeats
  heartbeatInterval = setInterval(() => {
    sendBeacon('heartbeat')
  }, config.interval!)

  // Don't keep process alive just for beacon
  heartbeatInterval.unref()

  // Send shutdown beacon
  const shutdown = () => {
    sendBeacon('shutdown')
  }

  process.once('exit', shutdown)
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  if (!config.silent) {
    console.log(`[ChittyBeacon] Tracking ${appInfo.name} on ${appInfo.platform}`)
  }
}

export function stop(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  sendBeacon('stopped')
}

// Auto-init if not in test environment
if (process.env.NODE_ENV !== 'test') {
  init()
}
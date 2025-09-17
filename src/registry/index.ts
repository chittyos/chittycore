/**
 * ChittyOS Registry - Service discovery and connection management
 * Manages service endpoints, connections, and health status
 */

import { EventEmitter } from 'eventemitter3'
import { nanoid } from 'nanoid'
import { sendBeacon } from '../beacon'

export interface ServiceEndpoint {
  id: string
  name: string
  type: 'api' | 'websocket' | 'grpc' | 'database' | 'storage' | 'custom'
  url: string
  protocol: string
  host: string
  port?: number
  path?: string
  metadata?: Record<string, any>
}

export interface ServiceConnection {
  id: string
  serviceId: string
  chittyId: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  establishedAt?: string
  lastPingAt?: string
  latency?: number
  error?: string
  metadata?: Record<string, any>
}

export interface ServiceHealth {
  serviceId: string
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  lastCheckAt: string
  uptime?: number
  responseTime?: number
  errorRate?: number
  checks: {
    name: string
    status: 'pass' | 'fail' | 'warn'
    message?: string
  }[]
}

export interface RegistryConfig {
  discoveryEndpoint?: string
  healthCheckInterval?: number
  connectionTimeout?: number
  maxRetries?: number
  enableAutoDiscovery?: boolean
}

export type RegistryEvents = {
  'service:registered': (service: ServiceEndpoint) => void
  'service:unregistered': (serviceId: string) => void
  'service:healthy': (serviceId: string) => void
  'service:unhealthy': (serviceId: string, error: string) => void
  'connection:established': (connection: ServiceConnection) => void
  'connection:lost': (connection: ServiceConnection) => void
  'discovery:update': (services: ServiceEndpoint[]) => void
}

class ServiceRegistry extends EventEmitter<RegistryEvents> {
  private config: Required<RegistryConfig>
  private services = new Map<string, ServiceEndpoint>()
  private connections = new Map<string, ServiceConnection>()
  private healthStatus = new Map<string, ServiceHealth>()
  private healthCheckTimers = new Map<string, NodeJS.Timeout>()
  private discoveryTimer: NodeJS.Timeout | null = null

  constructor(config: RegistryConfig = {}) {
    super()

    this.config = {
      discoveryEndpoint: config.discoveryEndpoint || process.env.CHITTY_REGISTRY_ENDPOINT || 'https://registry.chitty.cc',
      healthCheckInterval: config.healthCheckInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000,
      maxRetries: config.maxRetries || 3,
      enableAutoDiscovery: config.enableAutoDiscovery ?? true
    }

    if (this.config.enableAutoDiscovery) {
      this.startAutoDiscovery()
    }
  }

  /**
   * Register a service endpoint
   */
  registerService(service: Omit<ServiceEndpoint, 'id'>): ServiceEndpoint {
    const registeredService: ServiceEndpoint = {
      ...service,
      id: service.name + '_' + nanoid(8)
    }

    // Parse URL for components
    try {
      const url = new URL(service.url)
      registeredService.protocol = url.protocol.replace(':', '')
      registeredService.host = url.hostname
      registeredService.port = url.port ? parseInt(url.port) : undefined
      registeredService.path = url.pathname !== '/' ? url.pathname : undefined
    } catch (error) {
      console.warn('[Registry] Invalid URL for service:', service.name)
    }

    this.services.set(registeredService.id, registeredService)
    this.emit('service:registered', registeredService)

    // Start health checks
    this.startHealthCheck(registeredService.id)

    // Track registration
    sendBeacon('registry_service_registered', {
      serviceId: registeredService.id,
      name: registeredService.name,
      type: registeredService.type
    })

    return registeredService
  }

  /**
   * Unregister a service
   */
  unregisterService(serviceId: string): boolean {
    const service = this.services.get(serviceId)
    if (!service) {
      return false
    }

    // Stop health checks
    this.stopHealthCheck(serviceId)

    // Close connections
    for (const [connId, conn] of this.connections) {
      if (conn.serviceId === serviceId) {
        this.disconnectConnection(connId)
      }
    }

    this.services.delete(serviceId)
    this.healthStatus.delete(serviceId)
    this.emit('service:unregistered', serviceId)

    return true
  }

  /**
   * Get service by ID or name
   */
  getService(idOrName: string): ServiceEndpoint | undefined {
    // Try by ID first
    if (this.services.has(idOrName)) {
      return this.services.get(idOrName)
    }

    // Try by name
    for (const service of this.services.values()) {
      if (service.name === idOrName) {
        return service
      }
    }

    return undefined
  }

  /**
   * Get all services of a specific type
   */
  getServicesByType(type: ServiceEndpoint['type']): ServiceEndpoint[] {
    return Array.from(this.services.values()).filter(s => s.type === type)
  }

  /**
   * Establish connection to a service
   */
  async connectToService(
    serviceId: string,
    chittyId: string,
    metadata?: Record<string, any>
  ): Promise<ServiceConnection> {
    const service = this.services.get(serviceId)
    if (!service) {
      throw new Error(`Service ${serviceId} not found`)
    }

    const connection: ServiceConnection = {
      id: `conn_${nanoid()}`,
      serviceId,
      chittyId,
      status: 'connecting',
      metadata
    }

    this.connections.set(connection.id, connection)

    try {
      // Test connection based on service type
      const startTime = Date.now()
      await this.testConnection(service)
      const latency = Date.now() - startTime

      // Update connection status
      connection.status = 'connected'
      connection.establishedAt = new Date().toISOString()
      connection.latency = latency
      this.connections.set(connection.id, connection)

      this.emit('connection:established', connection)

      // Track connection
      sendBeacon('registry_connection_established', {
        serviceId,
        chittyId,
        latency
      })

      return connection
    } catch (error) {
      connection.status = 'error'
      connection.error = (error as Error).message
      this.connections.set(connection.id, connection)
      throw error
    }
  }

  /**
   * Disconnect a connection
   */
  disconnectConnection(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) {
      return false
    }

    connection.status = 'disconnected'
    this.emit('connection:lost', connection)
    this.connections.delete(connectionId)

    return true
  }

  /**
   * Get connection status
   */
  getConnection(connectionId: string): ServiceConnection | undefined {
    return this.connections.get(connectionId)
  }

  /**
   * Get all connections for a ChittyID
   */
  getConnectionsByChittyId(chittyId: string): ServiceConnection[] {
    return Array.from(this.connections.values()).filter(c => c.chittyId === chittyId)
  }

  /**
   * Test connection to a service
   */
  private async testConnection(service: ServiceEndpoint): Promise<void> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.connectionTimeout)

    try {
      const response = await fetch(service.url, {
        method: 'HEAD',
        signal: controller.signal
      })

      if (!response.ok && response.status !== 405) {
        throw new Error(`Service returned ${response.status}`)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Connection timeout')
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Perform health check on a service
   */
  private async performHealthCheck(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId)
    if (!service) {
      return
    }

    const health: ServiceHealth = {
      serviceId,
      status: 'unknown',
      lastCheckAt: new Date().toISOString(),
      checks: []
    }

    try {
      // Basic connectivity check
      const startTime = Date.now()
      await this.testConnection(service)
      const responseTime = Date.now() - startTime

      health.responseTime = responseTime
      health.status = responseTime < 1000 ? 'healthy' : 'degraded'
      health.checks.push({
        name: 'connectivity',
        status: 'pass',
        message: `Response time: ${responseTime}ms`
      })

      // Try health endpoint if available
      try {
        const healthUrl = new URL(service.url)
        healthUrl.pathname = '/health'
        const healthResponse = await fetch(healthUrl.toString(), {
          signal: AbortSignal.timeout(5000)
        })

        if (healthResponse.ok) {
          const healthData = await healthResponse.json() as any
          if (healthData.status) {
            health.status = healthData.status
          }
          if (healthData.checks) {
            health.checks.push(...healthData.checks)
          }
        }
      } catch (error) {
        // Health endpoint not available, that's ok
      }

      this.healthStatus.set(serviceId, health)

      if (health.status === 'healthy') {
        this.emit('service:healthy', serviceId)
      } else if (health.status === 'unhealthy') {
        this.emit('service:unhealthy', serviceId, 'Health check failed')
      }
    } catch (error) {
      health.status = 'unhealthy'
      health.checks.push({
        name: 'connectivity',
        status: 'fail',
        message: (error as Error).message
      })

      this.healthStatus.set(serviceId, health)
      this.emit('service:unhealthy', serviceId, (error as Error).message)
    }
  }

  /**
   * Start health checks for a service
   */
  private startHealthCheck(serviceId: string): void {
    // Perform initial check
    this.performHealthCheck(serviceId)

    // Schedule periodic checks
    const timer = setInterval(() => {
      this.performHealthCheck(serviceId)
    }, this.config.healthCheckInterval)

    this.healthCheckTimers.set(serviceId, timer)
  }

  /**
   * Stop health checks for a service
   */
  private stopHealthCheck(serviceId: string): void {
    const timer = this.healthCheckTimers.get(serviceId)
    if (timer) {
      clearInterval(timer)
      this.healthCheckTimers.delete(serviceId)
    }
  }

  /**
   * Auto-discover services from registry endpoint
   */
  private async discoverServices(): Promise<void> {
    if (!this.config.discoveryEndpoint) {
      return
    }

    try {
      const response = await fetch(`${this.config.discoveryEndpoint}/discover`)
      if (response.ok) {
        const services = await response.json() as ServiceEndpoint[]

        // Register discovered services
        for (const service of services) {
          if (!this.getService(service.id)) {
            this.registerService(service)
          }
        }

        this.emit('discovery:update', services)
      }
    } catch (error) {
      console.error('[Registry] Discovery failed:', error)
    }
  }

  /**
   * Start auto-discovery
   */
  private startAutoDiscovery(): void {
    // Initial discovery
    this.discoverServices()

    // Periodic discovery
    this.discoveryTimer = setInterval(() => {
      this.discoverServices()
    }, 60000) // Every minute
  }

  /**
   * Stop auto-discovery
   */
  stopAutoDiscovery(): void {
    if (this.discoveryTimer) {
      clearInterval(this.discoveryTimer)
      this.discoveryTimer = null
    }
  }

  /**
   * Get service health status
   */
  getHealth(serviceId: string): ServiceHealth | undefined {
    return this.healthStatus.get(serviceId)
  }

  /**
   * Get all registered services
   */
  getAllServices(): ServiceEndpoint[] {
    return Array.from(this.services.values())
  }

  /**
   * Get all active connections
   */
  getAllConnections(): ServiceConnection[] {
    return Array.from(this.connections.values())
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalServices: number
    healthyServices: number
    unhealthyServices: number
    totalConnections: number
    activeConnections: number
  } {
    const healthyServices = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'healthy').length

    const unhealthyServices = Array.from(this.healthStatus.values())
      .filter(h => h.status === 'unhealthy').length

    const activeConnections = Array.from(this.connections.values())
      .filter(c => c.status === 'connected').length

    return {
      totalServices: this.services.size,
      healthyServices,
      unhealthyServices,
      totalConnections: this.connections.size,
      activeConnections
    }
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    // Stop all health checks
    for (const serviceId of this.healthCheckTimers.keys()) {
      this.stopHealthCheck(serviceId)
    }

    // Stop auto-discovery
    this.stopAutoDiscovery()

    // Clear all data
    this.services.clear()
    this.connections.clear()
    this.healthStatus.clear()
  }
}

// Create singleton instance
let registryInstance: ServiceRegistry | null = null

export function getRegistry(config?: RegistryConfig): ServiceRegistry {
  if (!registryInstance) {
    registryInstance = new ServiceRegistry(config)
  }
  return registryInstance
}

// Export commonly used functions
export function registerService(service: Omit<ServiceEndpoint, 'id'>): ServiceEndpoint {
  return getRegistry().registerService(service)
}

export function connectToService(
  serviceId: string,
  chittyId: string,
  metadata?: Record<string, any>
): Promise<ServiceConnection> {
  return getRegistry().connectToService(serviceId, chittyId, metadata)
}

export function getService(idOrName: string): ServiceEndpoint | undefined {
  return getRegistry().getService(idOrName)
}

export function getAllServices(): ServiceEndpoint[] {
  return getRegistry().getAllServices()
}

export default {
  getRegistry,
  registerService,
  connectToService,
  getService,
  getAllServices,
  ServiceRegistry
}
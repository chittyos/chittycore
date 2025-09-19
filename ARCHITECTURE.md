# ChittyCore Architecture

## 🎭 Mini Orchestrator Pattern

ChittyCore acts as a **lightweight orchestrator** that coordinates between your application and the ChittyOS service ecosystem. Rather than implementing functionality locally, it orchestrates requests to specialized microservices.

```
┌─────────────────────────────────────────────────────────┐
│                   Your Application                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │                       │
         │    ChittyCore         │
         │  (Mini Orchestrator)  │
         │                       │
         └───────┬───────────────┘
                 │
     ┌───────────┴───────────────────────────┐
     │           Orchestrates to:            │
     └────────────────────────────────────────┘
         │         │         │         │
         ▼         ▼         ▼         ▼
    ┌────────┐┌────────┐┌────────┐┌────────┐
    │   ID   ││ Beacon ││  Auth  ││Registry│
    │Service ││Service ││Service ││Service │
    └────────┘└────────┘└────────┘└────────┘
    id.       beacon.   auth.     registry.
    chitty.cc chitty.cc chitty.cc chitty.cc
         │         │         │         │
         ▼         ▼         ▼         ▼
    ┌────────┐┌────────┐┌────────┐┌────────┐
    │ Canon  ││ Verify ││  Chat  ││  More  │
    │Service ││Service ││Service ││Services│
    └────────┘└────────┘└────────┘└────────┘
    canon.    verify.   chat.     *.
    chitty.cc chitty.cc chitty.cc chitty.cc
```

## 🎼 Orchestration Patterns

### 1. Service Discovery & Connection
ChittyCore discovers and maintains connections to ChittyOS services:

```typescript
// ChittyCore orchestrates service discovery
const services = await chittyCore.registry.getAllServices()
const chatService = await chittyCore.registry.getService('chat')

// Automatic service connection management
const connection = await chittyCore.registry.connectToService('chat')
```

### 2. Request Routing
Routes requests to appropriate services based on operation type:

```typescript
// ID operations → id.chitty.cc
const chittyId = await chittyCore.id.generate()

// Auth operations → auth.chitty.cc
const token = await chittyCore.auth.createToken()

// Monitoring → beacon.chitty.cc
chittyCore.beacon.sendBeacon('event', data)
```

### 3. Cross-Service Coordination
Orchestrates operations that span multiple services:

```typescript
// Example: User registration flow
async function registerUser(email: string) {
  // 1. Request ChittyID from id.chitty.cc
  const chittyId = await chittyCore.id.generate({
    metadata: { email }
  })

  // 2. Create auth token with auth.chitty.cc
  const token = await chittyCore.auth.createToken({
    chittyId: chittyId.id,
    roles: ['user']
  })

  // 3. Register with service registry
  await chittyCore.registry.registerService({
    name: `user-${chittyId.id}`,
    type: 'user',
    metadata: { email }
  })

  // 4. Send registration beacon
  chittyCore.beacon.sendBeacon('user_registered', {
    chittyId: chittyId.id,
    timestamp: Date.now()
  })

  return { chittyId, token }
}
```

### 4. Session Orchestration
Manages distributed session state across services:

```typescript
// Set session context for all services
chittyCore.setSessionContext('session-123')

// All subsequent service calls include session context
const chittyId = await chittyCore.id.generate()  // Includes session
const token = await chittyCore.auth.createToken() // Includes session
```

### 5. Error Recovery & Resilience
Orchestrates error handling and recovery across services:

```typescript
// Automatic retry with exponential backoff
const chittyId = await chittyCore.id.generate()
  .catch(() => chittyCore.id.generate()) // Retry once
  .catch(() => {
    // Fallback to cached or degraded mode
    return chittyCore.getCachedId()
  })
```

## 🔌 Service Connections

### Lightweight Client Connections
Each module maintains a lightweight connection to its service:

| Module | Service | Connection Type | Purpose |
|--------|---------|----------------|---------|
| `id` | id.chitty.cc | HTTPS REST | ChittyID requests |
| `beacon` | beacon.chitty.cc | HTTPS POST | Event streaming |
| `auth` | auth.chitty.cc | HTTPS REST | Token operations |
| `registry` | registry.chitty.cc | HTTPS REST | Service discovery |
| `canon` | canon.chitty.cc | HTTPS REST | Data synchronization |
| `verify` | verify.chitty.cc | HTTPS REST | Validation requests |
| `chat` | chat.chitty.cc | WebSocket | Real-time messaging |

### Connection Configuration
```typescript
// Configure all service connections
chittyCore.configure({
  id: {
    endpoint: 'https://id.chitty.cc',
    apiKey: process.env.CHITTY_API_KEY
  },
  beacon: {
    endpoint: 'https://beacon.chitty.cc',
    interval: 30000
  },
  auth: {
    endpoint: 'https://auth.chitty.cc'
  },
  registry: {
    endpoint: 'https://registry.chitty.cc',
    cache: true
  }
})
```

## 🎯 Orchestration Benefits

### 1. **Centralized Configuration**
Single point to configure all service connections:
```typescript
// One configuration for all services
import chittyCore from '@chittyos/core'
chittyCore.configure(config)
```

### 2. **Consistent Error Handling**
Unified error handling across all services:
```typescript
try {
  const result = await chittyCore.anyService.anyMethod()
} catch (error) {
  // Consistent error format from all services
  console.error(`Service: ${error.service}, Code: ${error.code}`)
}
```

### 3. **Cross-Service Transactions**
Coordinate operations across multiple services:
```typescript
// Orchestrated transaction
await chittyCore.transaction(async (tx) => {
  const chittyId = await tx.id.generate()
  const token = await tx.auth.createToken({ chittyId: chittyId.id })
  await tx.canon.createRecord({ chittyId, token })
  // All succeed or all roll back
})
```

### 4. **Service Health Monitoring**
Monitor health of all connected services:
```typescript
const health = await chittyCore.checkHealth()
// {
//   id: { status: 'healthy', latency: 45 },
//   beacon: { status: 'healthy', latency: 23 },
//   auth: { status: 'degraded', latency: 520 }
// }
```

### 5. **Request Optimization**
Batch and optimize requests across services:
```typescript
// Batched requests to minimize network calls
const results = await chittyCore.batch([
  chittyCore.id.generate(),
  chittyCore.auth.getCurrentUser(),
  chittyCore.registry.getAllServices()
])
```

## 🏗️ Implementation Pattern

### Current Implementation (v2.1.0)
```typescript
// Each module is a lightweight client
export const id = {
  async generate(metadata) {
    return fetch('https://id.chitty.cc/api/generate', {
      method: 'POST',
      body: JSON.stringify({ metadata })
    })
  }
}

export const beacon = {
  async sendBeacon(event, data) {
    return fetch('https://beacon.chitty.cc/api/beacon', {
      method: 'POST',
      body: JSON.stringify({ event, data })
    })
  }
}
```

### Future Enhancements
- **Circuit Breakers**: Prevent cascading failures
- **Request Caching**: Reduce redundant service calls
- **Load Balancing**: Distribute requests across service instances
- **Service Mesh Integration**: Work with Istio/Linkerd
- **Observability**: OpenTelemetry integration

## 📊 Metrics & Monitoring

ChittyCore collects orchestration metrics:

```typescript
// Get orchestration metrics
const metrics = chittyCore.getMetrics()
// {
//   totalRequests: 1523,
//   requestsByService: {
//     id: 234,
//     beacon: 890,
//     auth: 399
//   },
//   averageLatency: 120,
//   errorRate: 0.02
// }
```

## 🔐 Security

### Authentication Flow
```
Application → ChittyCore → Service
              ↓              ↓
          API Key      Service Auth
```

### Security Features
- **API Key Management**: Secure storage and rotation
- **Request Signing**: HMAC signatures for request integrity
- **TLS Enforcement**: All service connections use HTTPS/WSS
- **Token Refresh**: Automatic token refresh orchestration

## 🚀 Getting Started

### Basic Orchestration
```typescript
import chittyCore from '@chittyos/core'

// Configure orchestrator
chittyCore.configure({
  apiKey: process.env.CHITTY_API_KEY
})

// Use orchestrated services
async function myApp() {
  // ChittyCore orchestrates all service interactions
  const chittyId = await chittyCore.id.generate()
  const token = await chittyCore.auth.createToken({ chittyId: chittyId.id })

  chittyCore.beacon.sendBeacon('app_started', {
    chittyId: chittyId.id,
    authenticated: true
  })
}
```

### Advanced Orchestration
```typescript
// Complex orchestrated workflow
async function createSecureUser(email: string, role: string) {
  return chittyCore.orchestrate(async (services) => {
    // Step 1: Generate identity
    const chittyId = await services.id.generate({ email })

    // Step 2: Create canonical record
    const canonRecord = await services.canon.create({
      type: 'user',
      chittyId: chittyId.id,
      email
    })

    // Step 3: Create auth token
    const token = await services.auth.createToken({
      chittyId: chittyId.id,
      roles: [role],
      canonId: canonRecord.id
    })

    // Step 4: Register with service registry
    await services.registry.register({
      id: chittyId.id,
      type: 'user',
      services: ['chat', 'canon']
    })

    // Step 5: Send creation event
    services.beacon.sendBeacon('user_created', {
      chittyId: chittyId.id,
      role,
      timestamp: Date.now()
    })

    return { chittyId, token, canonRecord }
  })
}
```

## 📈 Performance Considerations

### Connection Pooling
ChittyCore maintains connection pools to each service:
```typescript
// Reuses connections for better performance
const pool = {
  id: new ConnectionPool({ max: 10 }),
  beacon: new ConnectionPool({ max: 5 }),
  auth: new ConnectionPool({ max: 10 })
}
```

### Request Deduplication
Prevents duplicate requests to services:
```typescript
// Multiple calls return same promise
const promise1 = chittyCore.id.generate()
const promise2 = chittyCore.id.generate()
// promise1 === promise2 (same request)
```

### Lazy Loading
Services are loaded only when needed:
```typescript
// Service client loaded on first use
const chittyId = await chittyCore.id.generate()
// ↑ Loads ID service client

// Unused services not loaded
// (e.g., chat client not loaded if never used)
```

## 🌍 Environment Support

### Node.js
Full orchestration capabilities in server environments:
```typescript
// Server-side orchestration
import chittyCore from '@chittyos/core'
const app = express()
app.use(chittyCore.middleware())
```

### Browser
Lightweight orchestration for web applications:
```typescript
// Browser-side orchestration
import chittyCore from '@chittyos/core/browser'
// Automatically uses fetch, WebSocket APIs
```

### Edge Workers
Optimized for edge compute environments:
```typescript
// Cloudflare Workers, Deno Deploy, etc.
import chittyCore from '@chittyos/core/edge'
// Minimal footprint, edge-optimized
```

---

**ChittyCore** - Your lightweight orchestrator for the ChittyOS service ecosystem
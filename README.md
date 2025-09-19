# @chittyos/core v2.1.0

**Mini Orchestrator for the ChittyOS Ecosystem**

ChittyCore is a lightweight orchestrator that coordinates between your application and ChittyOS microservices. Instead of implementing functionality locally, it orchestrates requests to specialized services, providing a unified interface to the entire ChittyOS ecosystem.

## 🎭 What is ChittyCore?

ChittyCore acts as your **mini orchestrator** - a single, lightweight library that:
- 🔌 **Connects** to all ChittyOS microservices
- 🎯 **Routes** requests to appropriate services
- 🔄 **Coordinates** cross-service operations
- 📊 **Manages** service discovery and health
- 🔐 **Handles** authentication across services
- 🎼 **Orchestrates** complex workflows

## 🏗️ Architecture

ChittyCore follows an **orchestrator pattern** where it doesn't implement functionality but orchestrates requests to specialized services:

```
     Your Application
            ↓
    ┌──────────────┐
    │  ChittyCore  │ ← Mini Orchestrator
    └──────┬───────┘
           │
    ┌──────┴────────────────────────────┐
    ↓      ↓      ↓      ↓      ↓      ↓
 id.cc  auth.cc beacon.cc registry.cc canon.cc chat.cc
```

**Service Connections:**
- **ID**: Requests ChittyIDs from `id.chitty.cc`
- **Auth**: Validates tokens with `auth.chitty.cc`
- **Registry**: Connects to `registry.chitty.cc`
- **Canon**: Syncs with `canon.chitty.cc`
- **Beacon**: Reports to `beacon.chitty.cc`
- **Chat**: Connects to `chat.chitty.cc`

## Installation

```bash
npm install @chittyos/core
```

## 📖 API Documentation

### 🔐 ID - ChittyID Requests

Request ChittyIDs from the id.chitty.cc service with proper authentication.

```typescript
import { generateChittyID, requestChittyID } from '@chittyos/core'

// Configure service endpoint and API key
import { id } from '@chittyos/core'
id.configure({
  endpoint: 'https://id.chitty.cc',
  apiKey: 'your-api-key'
})

// Request a ChittyID from the service
const chittyId = await generateChittyID({
  environment: 'production',
  application: 'my-app'
})

// Explicit request function
const chittyId2 = await requestChittyID({ metadata: { role: 'user' } })

// Validate ChittyID with service
const isValid = await validateChittyID('CID_...')

// Session context for distributed sync
import { setSessionContext, getSessionContext } from '@chittyos/core'
setSessionContext('session-123')
```

**Required Environment Variables:**
```bash
CHITTY_ID_ENDPOINT=https://id.chitty.cc
CHITTY_ID_API_KEY=your-api-key-from-chittyos
```

### 🎯 Beacon - Application Monitoring

Automatic application tracking and health monitoring to beacon.chitty.cc.

```typescript
import { beacon, initBeacon, sendBeacon } from '@chittyos/core'

// Auto-initialized on import, or manually configure:
beacon.configure({
  endpoint: 'https://beacon.chitty.cc',
  appName: 'my-app',
  environment: 'production'
})

// Send custom events
sendBeacon('user_action', {
  action: 'clicked_button',
  userId: 'user123'
})

// Detect application info
const appInfo = beacon.detectApp()
```

**Environment Variables:**
```bash
CHITTY_BEACON_ENDPOINT=https://beacon.chitty.cc
CHITTY_BEACON_INTERVAL=300000
CHITTY_BEACON_DISABLED=false  # Set to true to disable
```

### 🛡️ Auth - Authentication

JWT-based authentication with ChittyOS token validation.

```typescript
import { createToken, verifyToken, refreshToken } from '@chittyos/core'

// Create authenticated token
const token = await createToken({
  chittyId: 'CID_...',
  roles: ['user', 'admin'],
  permissions: ['read', 'write']
})

// Verify token
const user = await verifyToken(token.token)

// Refresh expired token
const newToken = await refreshToken(token.refreshToken)

// Check roles and permissions
import { hasRoles, hasPermissions } from '@chittyos/core'
const canAccess = hasRoles(user, ['admin']) && hasPermissions(user, ['write'])
```

### ✅ Verify - Data Validation

Comprehensive data validation and verification utilities.

```typescript
import { validateSchema, schemas, hashData, verifyIntegrity } from '@chittyos/core'

// Validate common data types
const emailResult = validateSchema('user@example.com', schemas.email)
const chittyIdResult = validateSchema('CID_...', schemas.chittyId)

if (emailResult.valid) {
  console.log('Email is valid')
}

// Data integrity verification
const hash = hashData('important data')
const isValid = verifyIntegrity('important data', hash)

// Sanitize user input
import { sanitizeInput } from '@chittyos/core'
const clean = sanitizeInput('<script>alert("xss")</script>')
```

### 🎨 Brand - ChittyOS Theming

Consistent ChittyOS branding and theme utilities.

```typescript
import {
  CHITTY_COLORS,
  CHITTY_THEME,
  generateStyleTag,
  generateTailwindConfig,
  ASCII_LOGO
} from '@chittyos/core'

// Apply ChittyOS theme
document.head.innerHTML += generateStyleTag('dark')

// Get CSS variables
const cssVars = getCSSVariables('light')

// Tailwind configuration
const tailwindConfig = generateTailwindConfig()

// Display ASCII logo (development mode)
console.log(ASCII_LOGO)
```

### 📚 Canon - Canonical Data Management

Manage canonical records with versioning and chain integrity.

```typescript
import {
  createCanonical,
  updateCanonical,
  getCanonical,
  validateCanonical
} from '@chittyos/core'

// Create canonical record
const record = createCanonical(
  { title: 'Important Document', version: '1.0' },
  'CID_author',
  { tags: ['production', 'final'] }
)

// Update canonical record
const updated = updateCanonical(record.id, {
  title: 'Updated Document',
  version: '1.1'
}, 'CID_editor')

// Retrieve canonical record
const retrieved = await getCanonical(record.id)

// Validate canonical chain
const isValid = validateCanonical(retrieved)
```

### 🌐 Registry - Service Discovery

Register and connect to services across the ChittyOS ecosystem.

```typescript
import {
  registerService,
  connectToService,
  getService,
  getAllServices
} from '@chittyos/core'

// Register your service
const service = await registerService({
  name: 'my-api',
  type: 'api',
  url: 'https://api.example.com',
  version: '1.0.0',
  health: 'https://api.example.com/health'
})

// Connect to existing service
const connection = await connectToService('chitty-chat')

// Get service information
const chatService = await getService('chitty-chat')

// List all services
const services = await getAllServices()
```

### 💬 ChittyChat - Messaging

Built-in messaging client connector for ChittyChat service.

```typescript
import { getChittyChat } from '@chittyos/core'

// Get ChittyChat client
const chat = getChittyChat()

// Connect with ChittyID
await chat.connect('CID_...')

// Send message
await chat.send('Hello, ChittyOS!')

// Listen for messages
chat.on('message', (message) => {
  console.log('Received:', message)
})
```

## 🎼 Orchestration Examples

### Simple Orchestration
```typescript
import chittyCore from '@chittyos/core'

// ChittyCore orchestrates across multiple services
async function setupUser(email: string) {
  // 1. Request ID from id.chitty.cc
  const chittyId = await chittyCore.id.generate()

  // 2. Create token via auth.chitty.cc
  const token = await chittyCore.auth.createToken({
    chittyId: chittyId.id
  })

  // 3. Register with registry.chitty.cc
  await chittyCore.registry.registerService({
    id: chittyId.id,
    type: 'user'
  })

  // 4. Send event to beacon.chitty.cc
  chittyCore.beacon.sendBeacon('user_created', {
    chittyId: chittyId.id
  })

  return { chittyId, token }
}
```

### Complex Workflow Orchestration
```typescript
// ChittyCore coordinates a complex multi-service workflow
async function processTransaction(data: any) {
  return chittyCore.orchestrate(async (services) => {
    // Validate with verify.chitty.cc
    const validation = await services.verify.validate(data)

    // Create canonical record at canon.chitty.cc
    const record = await services.canon.create(data)

    // Get auth token from auth.chitty.cc
    const token = await services.auth.createToken()

    // Register transaction with registry.chitty.cc
    await services.registry.register({
      type: 'transaction',
      canonId: record.id
    })

    // Send confirmation via chat.chitty.cc
    await services.chat.send('Transaction processed')

    // Report metrics to beacon.chitty.cc
    services.beacon.sendBeacon('transaction_complete', {
      recordId: record.id
    })

    return { record, token }
  })
}
```

## 🚀 Quick Start

### Basic Usage
```typescript
import { generateChittyID, sendBeacon, createToken } from '@chittyos/core'

// ChittyCore orchestrates requests to services
const chittyId = await generateChittyID()  // → id.chitty.cc
sendBeacon('app_started', { id: chittyId.id })  // → beacon.chitty.cc
const token = await createToken({ chittyId: chittyId.id })  // → auth.chitty.cc
```

### Module-based Usage
```typescript
import chittyCore from '@chittyos/core'

// Access individual modules
const { beacon, id, auth, verify, brand, canon, registry, chittychat } = chittyCore

// Use module functions
const chittyId = await id.generate()
beacon.sendBeacon('user_login', { id: chittyId.id })
```

### Auto-initialization
```typescript
// Simply importing enables beacon tracking
import '@chittyos/core'

// Beacon automatically starts tracking your application
// Disable with: CHITTY_BEACON_DISABLED=true
```

## ⚙️ Configuration

### Environment Variables

**Required for Production:**
```bash
# ChittyID Service (required for ID operations)
CHITTY_ID_ENDPOINT=https://id.chitty.cc
CHITTY_ID_API_KEY=your-chittyos-api-key

# Beacon Service (optional - auto-configured)
CHITTY_BEACON_ENDPOINT=https://beacon.chitty.cc
CHITTY_BEACON_INTERVAL=300000

# Disable beacon in development
CHITTY_BEACON_DISABLED=true
```

**Optional Service Endpoints:**
```bash
# Authentication Service
CHITTY_AUTH_ENDPOINT=https://auth.chitty.cc

# Canonical Data Service
CHITTY_CANON_ENDPOINT=https://canon.chitty.cc

# Service Registry
CHITTY_REGISTRY_ENDPOINT=https://registry.chitty.cc

# ChittyChat Messaging
CHITTY_CHAT_ENDPOINT=https://chat.chitty.cc
CHITTY_CHAT_WS=wss://ws.chitty.cc
```

### Programmatic Configuration

```typescript
import { id, beacon, auth } from '@chittyos/core'

// Configure ID service
id.configure({
  endpoint: 'https://id.chitty.cc',
  apiKey: process.env.CHITTY_ID_API_KEY
})

// Configure beacon
beacon.configure({
  endpoint: 'https://beacon.chitty.cc',
  appName: 'my-application',
  environment: 'production'
})
```

## 🔒 Authentication

ChittyCore requires API key authentication for most service operations:

1. **Get API Key**: Register at [chittyos.com](https://chittyos.com) to get your API key
2. **Set Environment**: `CHITTY_ID_API_KEY=your-api-key`
3. **Request ChittyIDs**: All ID operations now work with proper authentication

```typescript
// This requires valid API key
const chittyId = await generateChittyID()
```

## 📊 Error Handling

```typescript
import { generateChittyID } from '@chittyos/core'

try {
  const chittyId = await generateChittyID()
  console.log('Success:', chittyId.id)
} catch (error) {
  if (error.message.includes('authentication')) {
    console.error('API key required for ChittyID service')
  } else if (error.message.includes('service')) {
    console.error('ChittyOS service temporarily unavailable')
  }
}
```

## 🔗 Service Architecture

ChittyCore follows a **request-only architecture**:

```
Your Application
       ↓ (ChittyCore client)
   ChittyOS Services
       ↓ (authenticated requests)
   - id.chitty.cc
   - beacon.chitty.cc
   - auth.chitty.cc
   - registry.chitty.cc
   - canon.chitty.cc
   - chat.chitty.cc
```

## 📋 TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  ChittyID,
  AuthToken,
  BeaconConfig,
  CanonicalRecord
} from '@chittyos/core'

const chittyId: ChittyID = await generateChittyID()
const token: AuthToken = await createToken({ chittyId: chittyId.id })
```

## 🌟 Features

### Orchestration Capabilities
- 🎼 **Mini Orchestrator**: Lightweight coordination of all ChittyOS services
- 🔌 **Service Connections**: Pre-configured clients for all ecosystem services
- 🔄 **Workflow Coordination**: Orchestrate complex multi-service operations
- 🎯 **Request Routing**: Automatic routing to appropriate services
- 📊 **Service Discovery**: Dynamic service discovery and health monitoring

### Technical Features
- ✅ **Request-only Architecture**: No local implementation, pure orchestration
- ✅ **Auto-initialization**: Automatic service connection setup
- ✅ **TypeScript Support**: Full type definitions for all services
- ✅ **Session Management**: Distributed session sync across services
- ✅ **Error Recovery**: Built-in retry and fallback mechanisms
- ✅ **Environment Flexibility**: Works in Node.js, browser, and edge

## 📝 License

MIT © ChittyOS

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/@chittyos/core
- **GitHub Repository**: https://github.com/chittyos/chittycore
- **ChittyOS Website**: https://chittyos.com
- **Documentation**: https://docs.chittyos.com

---

**ChittyOS Core v2.1.0** - Essential client library for the ChittyOS ecosystem
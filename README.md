# @chittyos/core v2.0.0

Complete foundation package for all ChittyOS applications providing identity, authentication, verification, monitoring, canonical data management, service registry, messaging, and branding.

## Installation

```bash
npm install @chittyos/core
```

## Features

### 🎯 Beacon - Application Monitoring
Automatic application tracking and health monitoring.

```typescript
import { beacon } from '@chittyos/core'

// Auto-initialized on import, or manually:
beacon.init({
  endpoint: 'https://beacon.chitty.cc',
  appName: 'my-app'
})

// Send custom events
beacon.sendBeacon('user_action', { action: 'clicked_button' })
```

### 🔐 ID - Identity Management
Generate and manage ChittyIDs with cryptographic keys.

```typescript
import { generateChittyID } from '@chittyos/core'

const chittyId = await generateChittyID()
// Returns: { id: 'CID_xxx...', publicKey: '...', trustLevel: 0 }
```

### 🛡️ Auth - Authentication
JWT-based authentication with session management.

```typescript
import { createToken, verifyToken } from '@chittyos/core'

const token = await createToken({
  id: 'user123',
  chittyId: 'CID_xxx',
  roles: ['admin']
})

const user = await verifyToken(token.token)
```

### ✅ Verify - Data Validation
Comprehensive data validation and verification.

```typescript
import { validateSchema, schemas } from '@chittyos/core'

const result = validateSchema(email, schemas.email)
if (result.valid) {
  // Email is valid
}
```

### 🎨 Brand - Consistent Theming
ChittyOS branding utilities for consistent UI.

```typescript
import { CHITTY_THEME, generateStyleTag } from '@chittyos/core'

// Inject ChittyOS theme
document.head.innerHTML += generateStyleTag('dark')
```

### 📚 Canon - Source of Truth
Manage canonical records with versioning and chain integrity.

```typescript
import { createCanonical, validateCanonical } from '@chittyos/core'

const record = createCanonical(
  { data: 'important' },
  'CID_xxx',
  { tags: ['production'] }
)
```

### 🌐 Registry - Service Discovery
Register and connect to services across the ChittyOS ecosystem.

```typescript
import { registerService, connectToService } from '@chittyos/core'

const service = registerService({
  name: 'my-api',
  type: 'api',
  url: 'https://api.example.com'
})
```

### 💬 ChittyChat - Messaging
Built-in messaging client connector.

```typescript
import { getChittyChat } from '@chittyos/core'

const chat = getChittyChat()
await chat.connect('CID_xxx')
```

## Quick Start

```typescript
import chittyCore from '@chittyos/core'

// Everything is auto-initialized
// Beacon starts tracking immediately

// Use individual modules
const { beacon, id, auth, verify, brand } = chittyCore

// Or import specific functions
import { generateChittyID, createToken, validateSchema } from '@chittyos/core'
```

## Environment Variables

```bash
# Beacon
CHITTY_BEACON_ENDPOINT=https://beacon.chitty.cc
CHITTY_BEACON_INTERVAL=300000
CHITTY_BEACON_DISABLED=false

# ID Service
CHITTY_ID_ENDPOINT=https://id.chitty.cc
CHITTY_ID_API_KEY=your-api-key

# Auth
CHITTY_JWT_SECRET=your-secret-key

# Canon
CHITTY_CANON_ENDPOINT=https://canon.chitty.cc

# Registry
CHITTY_REGISTRY_ENDPOINT=https://registry.chitty.cc

# ChittyChat
CHITTY_CHAT_ENDPOINT=https://chat.chitty.cc
CHITTY_CHAT_WS=wss://ws.chitty.cc
```

## License

MIT © ChittyOS
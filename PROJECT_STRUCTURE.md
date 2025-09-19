# ChittyCore Project Structure

```
chittycore/
├── src/                    # Source code
│   ├── auth/              # Authentication module
│   ├── beacon/            # Monitoring module
│   ├── brand/             # Theming module
│   ├── canon/             # Canonical data module
│   ├── chittychat/        # Messaging module
│   ├── id/                # Identity module
│   ├── registry/          # Service registry module
│   ├── verify/            # Validation module
│   └── index.ts           # Main orchestrator
│
├── dist/                  # Built output (gitignored)
│   ├── *.js              # CommonJS builds
│   ├── *.mjs             # ES Module builds
│   └── *.d.ts            # TypeScript definitions
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # Orchestrator pattern docs
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── DISTRIBUTION.md    # Distribution strategy
│   └── NOTION_DOCS.md     # Notion documentation structure
│
├── scripts/               # Utility scripts
│   ├── deploy.sh          # Deployment script
│   ├── integrate-beacon-everywhere.sh
│   └── integrate-chittycore.sh
│
├── tests/                 # Test files
│   └── test-enhanced.js
│
├── examples/              # Usage examples
│   └── integration.js
│
├── README.md              # Main documentation
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript config
├── tsup.config.ts         # Build configuration
├── .gitignore             # Git ignore rules
├── .npmignore             # NPM publish ignore
└── PROJECT_STRUCTURE.md   # This file
```

## Key Directories

### `/src`
The orchestrator source code. Each module acts as a lightweight client to its respective ChittyOS service.

### `/dist`
Built and compiled output. Contains CommonJS, ES Modules, and TypeScript definitions.

### `/docs`
All documentation including architecture, deployment, and distribution strategies.

### `/scripts`
Utility scripts for deployment and integration.

### `/tests`
Test files for validating orchestrator functionality.

### `/examples`
Example implementations showing how to use ChittyCore.

## Module Structure

Each module in `/src` follows this pattern:
```
module/
├── index.ts        # Main module exports
├── types.ts        # TypeScript type definitions (if needed)
└── config.ts       # Module configuration (if needed)
```

## Build Output

The `/dist` folder contains:
- `index.js` - CommonJS main entry
- `index.mjs` - ES Module main entry
- `index.d.ts` - TypeScript definitions
- `[module]/index.*` - Individual module builds
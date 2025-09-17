/**
 * ChittyCore Integration Example
 * Shows how to use ChittyCore in your application
 */

const chittyCore = require('../dist/index.js')

async function main() {
  console.log(chittyCore.ASCII_LOGO)
  console.log('ChittyCore Integration Example')
  console.log('==============================\n')

  // 1. Beacon - Application monitoring
  console.log('1. BEACON - Application Monitoring')
  const appInfo = chittyCore.detectApp()
  console.log('  App:', appInfo.name)
  console.log('  Platform:', appInfo.platform)
  console.log('  ChittyOS Modules:', appInfo.chittyos.modules)

  // Send custom event
  chittyCore.sendBeacon('example_started', { example: 'integration' })
  console.log('  ✓ Beacon initialized\n')

  // 2. ID - Generate ChittyID
  console.log('2. ID - ChittyID Generation')
  const chittyId = await chittyCore.generateChittyID()
  console.log('  Generated ID:', chittyId.id)
  console.log('  Trust Level:', chittyId.trustLevel)
  console.log('  ✓ ChittyID created\n')

  // 3. Auth - Create authentication token
  console.log('3. AUTH - Token Management')
  const authToken = await chittyCore.createToken({
    id: chittyId.id,
    chittyId: chittyId.id,
    email: 'user@example.com',
    roles: ['user', 'developer'],
    permissions: ['read', 'write']
  })
  console.log('  Token:', authToken.token.substring(0, 50) + '...')
  console.log('  Expires:', authToken.expiresAt)

  // Verify token
  const verified = await chittyCore.verifyToken(authToken.token)
  console.log('  Verified User ID:', verified.id)
  console.log('  Roles:', verified.roles)
  console.log('  ✓ Auth working\n')

  // 4. Verify - Data validation
  console.log('4. VERIFY - Data Validation')

  // Validate email
  const emailResult = chittyCore.validateSchema(
    'test@example.com',
    chittyCore.validationSchemas.email
  )
  console.log('  Email valid:', emailResult.valid)

  // Validate ChittyID format
  const isValid = chittyCore.isValidChittyID(chittyId.id)
  console.log('  ChittyID format valid:', isValid)

  // Hash data
  const hash = chittyCore.hashData({ message: 'Hello ChittyOS' })
  console.log('  Data hash:', hash.substring(0, 16) + '...')

  // Sanitize input
  const dirty = '<script>alert("xss")</script>Hello'
  const clean = chittyCore.sanitizeInput(dirty)
  console.log('  Sanitized:', clean)
  console.log('  ✓ Verification working\n')

  // 5. Brand - Theming
  console.log('5. BRAND - Theming & Branding')
  console.log('  Name:', chittyCore.BRAND_CONFIG.name)
  console.log('  Tagline:', chittyCore.BRAND_CONFIG.tagline)
  console.log('  Primary Color (light):', chittyCore.CHITTY_COLORS.light.primary)
  console.log('  Primary Color (dark):', chittyCore.CHITTY_COLORS.dark.primary)

  // Generate CSS variables
  const cssVars = chittyCore.getCSSVariables('light')
  console.log('  CSS Variables:', cssVars.split('\n').length, 'variables generated')
  console.log('  ✓ Brand utilities working\n')

  // Complete
  console.log('✅ All ChittyCore modules tested successfully!')
  console.log('\nIntegration complete. ChittyCore is ready to use!')

  // Send completion event
  chittyCore.sendBeacon('example_completed', {
    success: true,
    modulesTest: ['beacon', 'id', 'auth', 'verify', 'brand']
  })

  // Stop beacon to allow process to exit
  chittyCore.beacon.stop()
}

// Run the example
main().catch(console.error)
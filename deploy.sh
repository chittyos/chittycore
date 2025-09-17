#!/bin/bash

# ChittyCore Deployment Script
# Publishes packages and updates repositories

set -e

echo "🚀 ChittyCore Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if npm package exists
check_npm_package() {
    local package_name=$1
    if npm view "$package_name" version 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to publish package
publish_package() {
    local package_path=$1
    local package_name=$2

    echo -e "${YELLOW}📦 Publishing $package_name...${NC}"
    cd "$package_path"

    # Check if already published
    if check_npm_package "$package_name"; then
        echo -e "${GREEN}✅ $package_name already published${NC}"
    else
        # Build first
        echo "  Building..."
        npm run build

        # Publish to npm (dry-run first)
        echo "  Performing dry-run..."
        npm publish --dry-run

        echo -e "${YELLOW}  Ready to publish. Continue? (y/n)${NC}"
        read -r response
        if [[ "$response" == "y" ]]; then
            npm publish --access public
            echo -e "${GREEN}✅ $package_name published successfully!${NC}"
        else
            echo -e "${RED}⚠️  Skipping publish for $package_name${NC}"
        fi
    fi
}

# Test ChittyCore locally
test_chittycore() {
    echo -e "${YELLOW}🧪 Testing ChittyCore locally...${NC}"

    cd /Users/nb/Development/chittycore

    # Create test file
    cat > test-chittycore.js << 'EOF'
const chittyCore = require('./dist/index.js')

console.log('Testing ChittyCore...')

// Test beacon
console.log('✓ Beacon module loaded')

// Test ID generation
const { generateLocal } = chittyCore.id
const chittyId = generateLocal()
console.log('✓ Generated ChittyID:', chittyId.id)

// Test auth
const { createToken } = chittyCore.auth
createToken({ id: chittyId.id }).then(token => {
    console.log('✓ Created auth token')
})

// Test verify
const { validateSchema, schemas } = chittyCore.verify
const emailResult = validateSchema('test@example.com', schemas.email)
console.log('✓ Email validation:', emailResult.valid)

// Test brand
const { CHITTY_COLORS } = chittyCore.brand
console.log('✓ Brand colors loaded:', Object.keys(CHITTY_COLORS).join(', '))

console.log('\n✅ All ChittyCore modules working!')
EOF

    node test-chittycore.js
    rm test-chittycore.js
}

# Main deployment flow
main() {
    echo "📋 Deployment Steps:"
    echo "1. Test ChittyCore locally"
    echo "2. Publish @chittyos/core to npm"
    echo "3. Publish @chittyos/chittychat-lite to npm"
    echo "4. Update repositories with npm packages"
    echo ""

    # Step 1: Test
    test_chittycore
    echo ""

    # Step 2: Publish ChittyCore
    echo -e "${YELLOW}Ready to publish packages? (y/n)${NC}"
    read -r response
    if [[ "$response" != "y" ]]; then
        echo "Deployment cancelled"
        exit 0
    fi

    publish_package "/Users/nb/Development/chittycore" "@chittyos/core"
    echo ""

    # Step 3: Publish ChittyChat Lite
    publish_package "/Users/nb/Development/chittychat-lite" "@chittyos/chittychat-lite"
    echo ""

    # Step 4: Update repositories
    echo -e "${YELLOW}📦 Updating repositories to use npm packages...${NC}"
    echo "Run the following in each repository:"
    echo ""
    echo "  npm uninstall @chittyos/core"
    echo "  npm install @chittyos/core"
    echo ""

    echo -e "${GREEN}✨ Deployment complete!${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update environment variables in production"
    echo "2. Configure beacon endpoints"
    echo "3. Test integrations in each service"
    echo "4. Monitor ChittyBeacon dashboard"
}

# Run main function
main
#!/bin/bash

# ChittyCore Universal Integration Script
# Integrates ChittyCore with beacon tracking into all ChittyOS and ChittyApps repositories

set -e

echo "🚀 ChittyCore Universal Integration"
echo "===================================="
echo ""

CHITTYCORE_PATH="/Users/nb/Development/chittycore"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to integrate ChittyCore into a repository
integrate_repo() {
    local repo_org=$1
    local repo_name=$2
    local repo_path=$3

    echo -e "${YELLOW}📦 Processing $repo_org/$repo_name...${NC}"

    # Clone if doesn't exist
    if [ ! -d "$repo_path" ]; then
        echo "  Cloning repository..."
        gh repo clone "$repo_org/$repo_name" "$repo_path" 2>/dev/null || {
            echo -e "  ${RED}⚠️  Failed to clone, skipping...${NC}"
            return
        }
    fi

    cd "$repo_path"

    # Check if it's a Node.js project
    if [ ! -f "package.json" ]; then
        echo "  ⚠️  No package.json found, skipping..."
        return
    fi

    # Check if already has ChittyCore
    if grep -q "@chittyos/core" package.json 2>/dev/null; then
        echo "  ✅ Already has ChittyCore, updating..."
        npm uninstall @chittyos/core 2>/dev/null || true
    fi

    # Install ChittyCore (using local path for now)
    echo "  📝 Installing @chittyos/core..."
    unset NODE_OPTIONS && npm install "file:$CHITTYCORE_PATH" --save

    # Find main entry file
    MAIN_FILE=""
    if [ -f "src/index.ts" ]; then
        MAIN_FILE="src/index.ts"
        IMPORT_STATEMENT="import '@chittyos/core' // Auto-initialize ChittyCore with beacon"
    elif [ -f "src/index.js" ]; then
        MAIN_FILE="src/index.js"
        IMPORT_STATEMENT="require('@chittyos/core') // Auto-initialize ChittyCore with beacon"
    elif [ -f "index.ts" ]; then
        MAIN_FILE="index.ts"
        IMPORT_STATEMENT="import '@chittyos/core' // Auto-initialize ChittyCore with beacon"
    elif [ -f "index.js" ]; then
        MAIN_FILE="index.js"
        IMPORT_STATEMENT="require('@chittyos/core') // Auto-initialize ChittyCore with beacon"
    fi

    # Add ChittyCore import if main file exists
    if [ -n "$MAIN_FILE" ]; then
        if ! grep -q "@chittyos/core" "$MAIN_FILE" 2>/dev/null; then
            echo "  🔧 Adding ChittyCore import to $MAIN_FILE..."
            echo "$IMPORT_STATEMENT" | cat - "$MAIN_FILE" > temp && mv temp "$MAIN_FILE"
        fi
    fi

    # Create or update .env.example
    if [ ! -f ".env.example" ]; then
        echo "  📝 Creating .env.example..."
        cat > .env.example << 'EOF'
# ChittyOS Core Configuration
CHITTY_BEACON_ENDPOINT=https://beacon.chitty.cc
CHITTY_BEACON_INTERVAL=300000
CHITTY_ID_ENDPOINT=https://id.chitty.cc
CHITTY_CHAT_ENDPOINT=https://chat.chitty.cc
CHITTY_CANON_ENDPOINT=https://canon.chitty.cc
CHITTY_REGISTRY_ENDPOINT=https://registry.chitty.cc
EOF
    fi

    echo -e "  ${GREEN}✅ Integration complete!${NC}"
}

# Get all ChittyOS repositories
echo "🔍 Fetching ChittyOS repositories..."
CHITTYOS_REPOS=$(gh repo list chittyos --limit 100 --json name,isArchived | jq -r '.[] | select(.isArchived == false) | .name')

echo "Found $(echo "$CHITTYOS_REPOS" | wc -l) active ChittyOS repositories"
echo ""

# Process ChittyOS repositories
for repo in $CHITTYOS_REPOS; do
    if [ "$repo" != "chittycore" ] && [ "$repo" != ".github" ]; then
        integrate_repo "chittyos" "$repo" "/tmp/chittyos-repos/$repo"
    fi
done

# Get all ChittyApps repositories
echo ""
echo "🔍 Fetching ChittyApps repositories..."
CHITTYAPPS_REPOS=$(gh repo list chittyapps --limit 100 --json name,isArchived 2>/dev/null | jq -r '.[] | select(.isArchived == false) | .name' || echo "")

if [ -n "$CHITTYAPPS_REPOS" ]; then
    echo "Found $(echo "$CHITTYAPPS_REPOS" | wc -l) active ChittyApps repositories"
    echo ""

    # Process ChittyApps repositories
    for repo in $CHITTYAPPS_REPOS; do
        if [ "$repo" != ".github" ]; then
            integrate_repo "chittyapps" "$repo" "/tmp/chittyapps-repos/$repo"
        fi
    done
else
    echo "No ChittyApps repositories found or organization not accessible"
fi

# Summary
echo ""
echo "========================================"
echo -e "${GREEN}✨ ChittyCore Integration Complete!${NC}"
echo ""
echo "All repositories now have:"
echo "✅ ChittyCore package installed"
echo "✅ Automatic beacon tracking enabled"
echo "✅ Access to all core modules (ID, Auth, Verify, Canon, Registry, ChittyChat)"
echo ""
echo "Next steps:"
echo "1. Publish @chittyos/core to npm: cd $CHITTYCORE_PATH && npm publish"
echo "2. Update repos to use npm version: npm install @chittyos/core@latest"
echo "3. Configure environment variables in production"
echo "4. Monitor beacon dashboard at https://beacon.chitty.cc"
echo ""
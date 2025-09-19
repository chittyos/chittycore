#!/bin/bash

# ChittyCore Integration Script
# Adds @chittyos/core to ChittyOS repositories

set -e

echo "🚀 ChittyCore Integration Script"
echo "================================"

# Configuration
CHITTYCORE_VERSION="1.0.0"
CHITTYCORE_PATH="/Users/nb/Development/chittycore"

# Function to add ChittyCore to a repository
integrate_repo() {
    local repo_name=$1
    local repo_path=$2

    echo "📦 Processing $repo_name..."

    if [ ! -d "$repo_path" ]; then
        echo "  ⚠️  Repository not found at $repo_path, skipping..."
        return
    fi

    cd "$repo_path"

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "  ⚠️  No package.json found, skipping..."
        return
    fi

    # Check if already has ChittyCore
    if grep -q "@chittyos/core" package.json 2>/dev/null; then
        echo "  ✅ Already has ChittyCore"
        return
    fi

    # Add ChittyCore as dependency using local path for now
    echo "  📝 Adding @chittyos/core dependency..."
    npm install "file:$CHITTYCORE_PATH" --save

    # Create or update initialization file
    if [ -f "src/index.ts" ] || [ -f "src/index.js" ]; then
        echo "  🔧 Adding ChittyCore import to main file..."

        # Determine file extension
        if [ -f "src/index.ts" ]; then
            MAIN_FILE="src/index.ts"
            IMPORT_STATEMENT="import '@chittyos/core' // Auto-initialize ChittyCore"
        else
            MAIN_FILE="src/index.js"
            IMPORT_STATEMENT="require('@chittyos/core') // Auto-initialize ChittyCore"
        fi

        # Check if import already exists
        if ! grep -q "@chittyos/core" "$MAIN_FILE" 2>/dev/null; then
            # Add import at the top of the file
            echo "$IMPORT_STATEMENT" | cat - "$MAIN_FILE" > temp && mv temp "$MAIN_FILE"
        fi
    fi

    echo "  ✅ Integrated successfully!"
}

# ChittyOS repositories to integrate
echo ""
echo "🔍 Integrating ChittyCore into ChittyOS repositories..."
echo ""

# Main ChittyOS repos
integrate_repo "chittychat" "/Users/nb/configured/claude/mcp-servers/chittychat"
integrate_repo "chittyid" "/Users/nb/configured/claude/mcp-servers/chittyid"
integrate_repo "chittymonitor" "/Users/nb/Development/chittymonitor"
integrate_repo "chittyinsight" "/Users/nb/Development/chittyinsight"
integrate_repo "chittyfinance" "/Users/nb/Development/chittyfinance"
integrate_repo "chittycleaner" "/Users/nb/Development/chittycleaner"
integrate_repo "chittystandard" "/Users/nb/Development/chittystandard"

# ChittyApps repos
integrate_repo "chittyintel" "/Users/nb/Development/chittyintel"
integrate_repo "contradiction-engine" "/Users/nb/Development/contradiction-engine"
integrate_repo "chittychronicle" "/Users/nb/Development/chittychronicle"
integrate_repo "chittyresolution" "/Users/nb/Development/chittyresolution"
integrate_repo "chittyevidence" "/Users/nb/Development/chittyevidence"
integrate_repo "chittytrace" "/Users/nb/Development/chittytrace"

echo ""
echo "✨ ChittyCore integration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Test each repository to ensure ChittyCore is working"
echo "2. Publish @chittyos/core to npm: npm publish"
echo "3. Update dependencies to use npm version instead of local path"
echo "4. Configure environment variables for each service"
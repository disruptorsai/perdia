#!/bin/bash
# Script to set Netlify environment variables via API
# Usage: ./scripts/set-netlify-env.sh

SITE_ID="371d61d6-ad3d-4c13-8455-52ca33d1c0d4"

echo "Setting Netlify environment variables for Perdia Education..."
echo ""
echo "⚠️  This script requires a Netlify API token."
echo "⚠️  Alternatively, set these manually in the dashboard:"
echo "    https://app.netlify.com/sites/perdia-education/configuration/env"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "   Please create .env.local with your credentials first"
    exit 1
fi

# Source the environment variables
source .env.local

# Required environment variables
declare -A ENV_VARS=(
    ["VITE_SUPABASE_URL"]="$VITE_SUPABASE_URL"
    ["VITE_SUPABASE_ANON_KEY"]="$VITE_SUPABASE_ANON_KEY"
    ["ANTHROPIC_API_KEY"]="${VITE_ANTHROPIC_API_KEY}"  # Use VITE_ version from .env.local
    ["OPENAI_API_KEY"]="${VITE_OPENAI_API_KEY}"  # Use VITE_ version from .env.local
    ["VITE_DEFAULT_AI_PROVIDER"]="$VITE_DEFAULT_AI_PROVIDER"
)

echo "The following variables need to be set in Netlify:"
echo ""

for key in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$key]}"
    if [ -z "$value" ]; then
        echo "❌ $key - NOT SET in .env.local"
    else
        echo "✅ $key - Found (${#value} characters)"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "MANUAL SETUP REQUIRED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Please add these environment variables manually:"
echo ""
echo "1. Go to: https://app.netlify.com/sites/perdia-education/configuration/env"
echo "2. Click 'Add a variable' for each of the following:"
echo ""

for key in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$key]}"
    if [ -n "$value" ]; then
        # Mask sensitive values
        if [[ $key == *"KEY"* ]] || [[ $key == *"SECRET"* ]]; then
            masked="${value:0:10}...${value: -4}"
            echo "   $key = $masked"
        else
            echo "   $key = $value"
        fi
    fi
done

echo ""
echo "3. Set scope to: 'All scopes' or 'Production'"
echo "4. Click 'Create variable'"
echo "5. After adding all variables, trigger a new deployment"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

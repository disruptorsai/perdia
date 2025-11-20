#!/bin/bash
# ================================================================
# PERDIA EDUCATION - Deploy Critical Fixes
# ================================================================
# This script applies the database migration and deploys the
# Edge Function fix for xAI API integration
# ================================================================

set -e  # Exit on error

echo "🚀 PERDIA EDUCATION - Deploying Critical Fixes"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Set Supabase Secret
echo -e "${BLUE}Step 1: Setting XAI_API_KEY in Supabase...${NC}"

# Load from .env.local if it exists
if [ -f .env.local ]; then
    source .env.local
    XAI_KEY="${VITE_XAI_API_KEY}"
else
    echo -e "${YELLOW}Warning: .env.local not found${NC}"
    XAI_KEY=""
fi

if [ -z "$XAI_KEY" ]; then
    echo -e "${RED}❌ XAI_API_KEY not found in .env.local${NC}"
    echo "   Please run manually:"
    echo "   Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/functions"
    echo "   Add secret: XAI_API_KEY = [your key from .env.local]"
    read -p "Press Enter after you've set the secret manually..."
else
    echo "Command: npx supabase secrets set XAI_API_KEY=\${XAI_KEY}"
    npx supabase secrets set XAI_API_KEY="${XAI_KEY}" || {
        echo -e "${RED}❌ Failed to set secret. Please run manually:${NC}"
        echo "   Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/functions"
        echo "   Add secret: XAI_API_KEY = [your key from .env.local]"
        read -p "Press Enter after you've set the secret manually..."
    }
fi
echo -e "${GREEN}✅ XAI_API_KEY configured${NC}"
echo ""

# Step 2: Apply Database Migration
echo -e "${BLUE}Step 2: Applying database migration (source_idea_id column)...${NC}"
echo "Opening SQL Editor..."
echo ""
echo -e "${YELLOW}MANUAL ACTION REQUIRED:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new"
echo "2. Copy and paste the SQL from: supabase/migrations/20251120000001_add_source_idea_id_to_articles.sql"
echo "3. Click 'Run'"
echo ""
read -p "Press Enter after you've applied the migration..."
echo -e "${GREEN}✅ Database migration applied${NC}"
echo ""

# Step 3: Deploy Edge Function
echo -e "${BLUE}Step 3: Deploying invoke-llm Edge Function...${NC}"
npx supabase functions deploy invoke-llm || {
    echo -e "${RED}❌ Deployment failed. Common issues:${NC}"
    echo "  - Docker not running (required for deployment)"
    echo "  - Not linked to project (run: npx supabase link --project-ref yvvtsfgryweqfppilkvo)"
    echo "  - Insufficient permissions"
    echo ""
    echo -e "${YELLOW}Try manual deployment:${NC}"
    echo "  1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions"
    echo "  2. Find 'invoke-llm' function"
    echo "  3. Click 'Deploy' and upload: supabase/functions/invoke-llm/index.ts"
    exit 1
}
echo -e "${GREEN}✅ Edge Function deployed${NC}"
echo ""

# Step 4: Verify Deployment
echo -e "${BLUE}Step 4: Verifying deployment...${NC}"
echo "Testing at: https://perdia.netlify.app/v1/content-ideas"
echo ""
echo -e "${GREEN}✅ All fixes deployed!${NC}"
echo ""
echo "================================================"
echo "🎉 DEPLOYMENT COMPLETE"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Visit: https://perdia.netlify.app/v1/content-ideas"
echo "2. Click 'Find Ideas' button"
echo "3. Verify article generation works"
echo ""
echo "Test credentials:"
echo "  Email: test@perdiatest.com"
echo "  Password: TestPass123!@#"
echo ""

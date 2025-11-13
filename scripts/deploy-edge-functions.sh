#!/bin/bash

# PERDIA V2 - Edge Function Deployment Script
# ============================================
#
# This script deploys all V2 Edge Functions to Supabase
#
# Prerequisites:
# 1. Supabase CLI installed: npm install -g supabase
# 2. Authenticated: supabase login
# 3. API keys set in Supabase secrets (GROK_API_KEY, PERPLEXITY_API_KEY)
#
# Usage:
#   bash scripts/deploy-edge-functions.sh

PROJECT_REF="yvvtsfgryweqfppilkvo"

echo "========================================="
echo "PERDIA V2 - Edge Function Deployment"
echo "========================================="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Deploy functions
echo "📦 Deploying Edge Functions..."
echo ""

echo "1/4 Deploying invoke-grok..."
supabase functions deploy invoke-grok --project-ref $PROJECT_REF --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ invoke-grok deployed successfully"
else
    echo "❌ invoke-grok deployment failed"
fi
echo ""

echo "2/4 Deploying invoke-perplexity..."
supabase functions deploy invoke-perplexity --project-ref $PROJECT_REF --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ invoke-perplexity deployed successfully"
else
    echo "❌ invoke-perplexity deployment failed"
fi
echo ""

echo "3/4 Deploying auto-approve-articles..."
supabase functions deploy auto-approve-articles --project-ref $PROJECT_REF --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ auto-approve-articles deployed successfully"
else
    echo "❌ auto-approve-articles deployment failed"
fi
echo ""

echo "4/4 Deploying ingest-monthly-questions..."
supabase functions deploy ingest-monthly-questions --project-ref $PROJECT_REF --no-verify-jwt
if [ $? -eq 0 ]; then
    echo "✅ ingest-monthly-questions deployed successfully"
else
    echo "❌ ingest-monthly-questions deployment failed"
fi
echo ""

echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Verify functions at: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "2. Test with: npm run test:v2"
echo "3. Check logs if any failures"

@echo off
REM ================================================================
REM PERDIA EDUCATION - Deploy Critical Fixes (Windows)
REM ================================================================
REM This script applies the database migration and deploys the
REM Edge Function fix for xAI API integration
REM ================================================================

echo.
echo ========================================================
echo   PERDIA EDUCATION - Deploying Critical Fixes
echo ========================================================
echo.

REM Step 1: Instructions for Supabase Secret
echo [STEP 1] Set XAI_API_KEY in Supabase
echo.
echo Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/settings/functions
echo.
echo Add this secret:
echo   Name: XAI_API_KEY
echo   Value: [Copy VITE_XAI_API_KEY value from your .env.local file]
echo.
echo Your .env.local should contain VITE_XAI_API_KEY
echo.
pause

REM Step 2: Instructions for Database Migration
echo.
echo [STEP 2] Apply Database Migration
echo.
echo Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/sql/new
echo.
echo Copy/paste SQL from: supabase\migrations\20251120000001_add_source_idea_id_to_articles.sql
echo.
echo Then click "Run"
echo.
pause

REM Step 3: Deploy Edge Function
echo.
echo [STEP 3] Deploy Edge Function
echo.
echo Attempting to deploy invoke-llm function...
echo.

npx supabase functions deploy invoke-llm
if errorlevel 1 (
    echo.
    echo [WARNING] Deployment failed. This may be due to:
    echo   - Docker not running
    echo   - Insufficient permissions
    echo.
    echo Manual deployment:
    echo   1. Go to: https://supabase.com/dashboard/project/yvvtsfgryweqfppilkvo/functions
    echo   2. Click on 'invoke-llm' function
    echo   3. Deploy the function from: supabase\functions\invoke-llm\
    echo.
    pause
) else (
    echo.
    echo [SUCCESS] Edge Function deployed!
    echo.
)

REM Step 4: Summary
echo.
echo ========================================================
echo   DEPLOYMENT COMPLETE
echo ========================================================
echo.
echo Test the fix at: https://perdia.netlify.app/v1/content-ideas
echo.
echo Test credentials:
echo   Email: test@perdiatest.com
echo   Password: TestPass123!@#
echo.
echo Click "Find Ideas" to test article generation
echo.
pause

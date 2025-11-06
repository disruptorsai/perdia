# Claude Code Configuration for Perdia

This directory contains Claude Code project-specific settings.

## GitHub Account Management

This repository is under the **disruptorsai** GitHub organization. If you also work with other GitHub organizations (like TechIntegrationLabs), you can set up automatic account switching.

### Setup Instructions

Create `.claude/settings.local.json` (this file is gitignored and won't be committed):

```json
{
  "hooks": {
    "SessionStart": {
      "command": "gh auth switch --user disruptorsai",
      "description": "Auto-switch to disruptorsai GitHub account when opening this project"
    }
  }
}
```

This will automatically switch to the correct GitHub account whenever you open this repository in Claude Code or Cursor.

### For Other Repositories

For your **TechIntegrationLabs** repositories, create a similar `.claude/settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": {
      "command": "gh auth switch --user TechIntegrationLabs",
      "description": "Auto-switch to TechIntegrationLabs GitHub account"
    }
  }
}
```

### Checking Current Account

You can verify which GitHub account is active at any time:

```bash
gh auth status
```

### Prerequisites

- GitHub CLI (`gh`) must be installed
- Both accounts must be authenticated: `gh auth login`
- Use `gh auth switch` to manually switch between accounts

## MCP Server Configuration

This repository uses **project-specific MCP (Model Context Protocol) servers** to ensure Claude Code connects to the correct services for the Perdia project.

### Perdia Project Services

- **Supabase Project:** `yvvtsfgryweqfppilkvo` (Perdia Education database)
- **Netlify Site:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4` (perdia-education)
  - **MCP Account:** `netlify-primary` (DisruptorsAI)
  - **Token:** `nfp_MnQi8ZEPrTaGqoT9TBdhba5k3BuDaQLBfb06`
- **Cloudinary:** Media optimization for Perdia
- **DataForSEO:** Keyword research and SEO data

### Setup Instructions

1. Copy the example MCP configuration:
   ```bash
   cp .claude/mcp.json.example .claude/mcp.json
   ```

2. Edit `.claude/mcp.json` and replace placeholder values with your actual tokens:
   - `SUPABASE_ACCESS_TOKEN` - Get from https://supabase.com/dashboard/account/tokens
   - `NETLIFY_AUTH_TOKEN` - Get from https://app.netlify.com/user/applications#personal-access-tokens
   - `CLOUDINARY_*` - Get from Cloudinary dashboard
   - `DATAFORSEO_*` - Get from DataForSEO account

3. The MCP configuration is **gitignored** to protect your credentials.

### Why Project-Specific MCP?

The global MCP config (`~/.claude/mcp.json`) might point to different Supabase/Netlify projects. This project-specific config ensures that when working on Perdia, Claude Code always connects to the correct Perdia Education services.

### Available MCP Servers for Perdia

- **supabase** - Direct database access, schema inspection, query testing
- **netlify** - Deployment management, build logs, environment variables
- **cloudinary** - Image optimization and media management
- **dataforseo** - Keyword research, competitor analysis, SEO metrics

## Files in This Directory

- **`settings.json`** - Shared team settings (committed to git)
- **`settings.local.json`** - Personal overrides (gitignored, not committed)
- **`mcp.json`** - Project-specific MCP servers (gitignored, not committed)
- **`mcp.json.example`** - Example MCP configuration template (committed to git)
- **`agents/`** - Custom agent definitions (perdia-supabase-database-agent)
- **`commands/`** - Project-specific slash commands (if present)

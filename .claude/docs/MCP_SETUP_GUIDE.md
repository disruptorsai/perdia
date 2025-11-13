# MCP Server Setup Guide for Perdia

## Quick Start

The Perdia project has **project-level MCP servers** configured in `.claude/mcp.json`. These servers are automatically available when working in this repository.

## Current Configuration

### ✅ Already Configured Servers

1. **Supabase** (`supabase`)
   - Project Ref: `yvvtsfgryweqfppilkvo`
   - Access Token: Configured ✅
   - URL: `https://yvvtsfgryweqfppilkvo.supabase.co`

2. **Netlify** (`netlify`)
   - Site ID: `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
   - Auth Token: Configured ✅ (netlify-primary account)
   - Account: DisruptorsAI

3. **Cloudinary** (`cloudinary`)
   - Cloud Name: `dvcvxhzmt`
   - API Key: Configured ✅

4. **DataForSEO** (`dataforseo`)
   - Username: Configured ✅
   - Password: Configured ✅

5. **Playwright** (`playwright`)
   - Headless: `false` (visible browser)
   - Ready for testing ✅

## How MCP Servers Work in This Repo

### File Locations

```
C:\Users\Disruptors\
├── .cursor\
│   └── mcp.json                    # Global MCP config (20+ servers)
└── Documents\Disruptors Projects\perdia\
    └── .claude\
        └── mcp.json                # Project-level config (5 servers) ⭐ THIS ONE
```

### Precedence Rules

When you're working in the Perdia repository:
1. **Project-level config** (`.claude/mcp.json`) takes precedence
2. Servers defined here override global settings
3. Use project-specific naming: `supabase`, `netlify` (NOT `netlify-primary`)

## Ensuring MCP Servers Always Work

### 1. Keep Credentials in Sync

If you update tokens in the global config, update the project config too:

```json
// Global config: C:\Users\Disruptors\.cursor\mcp.json
{
  "netlify-primary": {
    "env": {
      "NETLIFY_AUTH_TOKEN": "NEW_TOKEN_HERE"
    }
  }
}

// Project config: .claude/mcp.json
{
  "netlify": {
    "env": {
      "NETLIFY_AUTH_TOKEN": "NEW_TOKEN_HERE"  // Update this too
    }
  }
}
```

### 2. Use Project-Level Naming

**✅ DO:**
```javascript
// Use project-level names
const site = await mcp__netlify__get_site()
const tables = await mcp__supabase__list_resources()
```

**❌ DON'T:**
```javascript
// Don't use global names
const site = await mcp__netlify-primary__get_site()  // Wrong!
```

### 3. Verify Configuration

Run this quick check to ensure MCP servers are configured:

```bash
# Check if .claude/mcp.json exists
ls .claude/mcp.json

# Verify Supabase is configured
cat .claude/mcp.json | grep "supabase"

# Verify Netlify is configured
cat .claude/mcp.json | grep "netlify"
```

### 4. Test MCP Servers

**Supabase Test:**
```javascript
// List all tables
mcp__supabase__list_resources()

// Should return: keywords, content_queue, agent_definitions, etc.
```

**Netlify Test:**
```javascript
// Get site info
mcp__netlify__get_site()

// Should return: site name, URL, build settings
```

**Playwright Test:**
```javascript
// Navigate to deployed site
mcp__playwright__navigate({
  url: "https://perdia-education.netlify.app"
})

// Take screenshot
mcp__playwright__screenshot({ path: "test.png" })
```

## Troubleshooting

### MCP Server Not Found

**Problem:** `Error: MCP server "supabase" not found`

**Solution:**
1. Check `.claude/mcp.json` exists in the project root
2. Verify the server name matches exactly (case-sensitive)
3. Restart Claude Code to reload MCP configuration

### Authentication Errors

**Problem:** `Error: Invalid access token`

**Solutions:**

**For Supabase:**
1. Go to Supabase Dashboard → Settings → API
2. Generate new access token
3. Update `.claude/mcp.json`:
   ```json
   {
     "supabase": {
       "env": {
         "SUPABASE_ACCESS_TOKEN": "sbp_NEW_TOKEN_HERE"
       }
     }
   }
   ```

**For Netlify:**
1. Go to Netlify Dashboard → User Settings → Applications
2. Generate new personal access token
3. Update `.claude/mcp.json`:
   ```json
   {
     "netlify": {
       "env": {
         "NETLIFY_AUTH_TOKEN": "nfp_NEW_TOKEN_HERE"
       }
     }
   }
   ```

### Connection Errors

**Problem:** `Error: Unable to connect to Supabase project`

**Solution:**
1. Verify project ref is correct: `yvvtsfgryweqfppilkvo`
2. Check Supabase project is active (not paused)
3. Verify URL matches: `https://yvvtsfgryweqfppilkvo.supabase.co`

## Adding New MCP Servers

If you need to add additional MCP servers for this project:

1. **Update `.claude/mcp.json`:**
   ```json
   {
     "mcpServers": {
       "existing-server": { ... },
       "new-server": {
         "command": "npx",
         "args": ["-y", "new-mcp-server@latest"],
         "env": {
           "API_KEY": "your_key_here"
         },
         "metadata": {
           "description": "What this server does",
           "project": "perdia-education"
         }
       }
     }
   }
   ```

2. **Update CLAUDE.md** with server details

3. **Update Infrastructure Agent** (`.claude/agents/perdia-infrastructure-agent.md`)

4. **Restart Claude Code** to load new configuration

## Best Practices

### 1. Never Commit Credentials
```bash
# Add to .gitignore if not already there
echo ".claude/mcp.json" >> .gitignore
```

Instead, commit a template:
```bash
cp .claude/mcp.json .claude/mcp.json.example

# Remove credentials from example
# Commit .claude/mcp.json.example to version control
```

### 2. Document Server Usage

When using an MCP server in code, add a comment:
```javascript
// Using Supabase MCP to check schema before migration
const tables = await mcp__supabase__list_resources()
```

### 3. Use Infrastructure Agent

For complex MCP operations, invoke the Infrastructure Agent:
```
"Use infrastructure agent to deploy to production"
"Check database schema via infrastructure agent"
"Test deployed site using infrastructure agent"
```

### 4. Monitor Usage and Costs

```javascript
// Cloudinary usage
mcp__cloudinary__usage_stats()

// Supabase database size
mcp__supabase__run_sql({
  sql: "SELECT pg_size_pretty(pg_database_size(current_database()))"
})

// Netlify build minutes
mcp__netlify__get_account_usage()
```

## Reference

### MCP Server Names (Project-Level)

| Server | Name | Purpose |
|--------|------|---------|
| Supabase | `supabase` | Database operations, schema inspection, SQL queries |
| Netlify | `netlify` | Deployment management, environment variables, builds |
| Cloudinary | `cloudinary` | Image optimization, media asset management |
| DataForSEO | `dataforseo` | Keyword research, SEO metrics, SERP data |
| Playwright | `playwright` | Browser automation, testing, screenshots |

### Quick Reference

**Database Operations:**
```javascript
mcp__supabase__list_resources()
mcp__supabase__read_resource({ uri: "supabase://table/TABLE_NAME" })
mcp__supabase__run_sql({ sql: "SELECT * FROM table" })
```

**Deployment Operations:**
```javascript
mcp__netlify__get_site()
mcp__netlify__list_deploys()
mcp__netlify__create_deploy()
```

**Testing Operations:**
```javascript
mcp__playwright__navigate({ url: "URL" })
mcp__playwright__screenshot({ path: "screenshot.png" })
mcp__playwright__click({ selector: "CSS_SELECTOR" })
```

## Support

**Documentation:**
- Infrastructure Agent: `.claude/agents/perdia-infrastructure-agent.md`
- Project Instructions: `CLAUDE.md`
- Database Operations: `docs/SUPABASE_AGENT_QUICK_REFERENCE.md`

**External Resources:**
- [MCP Specification](https://modelcontextprotocol.io/)
- [Supabase MCP Server](https://github.com/supabase/mcp-server-supabase)
- [Netlify MCP Server](https://github.com/netlify/mcp)

---

**Last Updated:** 2025-11-12
**Version:** 1.0.0
**Project:** Perdia Education Platform

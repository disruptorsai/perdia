# Netlify MCP Account Configuration

**Date:** 2025-11-05
**Status:** ✅ Configured

---

## Project Configuration

This Perdia Education repository is configured to use the **primary (DisruptorsAI)** Netlify account via Claude Code MCP.

### Netlify Account Details

- **MCP Server Name:** `netlify-primary`
- **Account:** DisruptorsAI
- **Token:** `nfp_MnQi8ZEPrTaGqoT9TBdhba5k3BuDaQLBfb06`
- **Project ID:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
- **Site Name:** perdia-education
- **Dashboard:** https://app.netlify.com/sites/perdia-education/overview

### Alternative Account (Not Used for This Project)

- **MCP Server Name:** `netlify-secondary`
- **Account:** TechIntegrationLabs
- **Token:** `nfp_MLwjLNbFh8cHfP6Bdoy4fTmBaUP5EPEi61d7`
- **Usage:** For other projects only

---

## Claude Code MCP Configuration

When working with this repository, Claude Code should **always** use the `netlify-primary` MCP server for:

- Deployment operations
- Build management
- Environment variable configuration
- Site settings
- Deploy previews
- Build logs and debugging

### How to Verify MCP Connection

When Claude Code performs Netlify operations, it should:
1. Connect to `netlify-primary` MCP server
2. Use project ID `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
3. Target the DisruptorsAI account

---

## Updated Documentation

All references to Netlify in this repository have been updated to include MCP account information:

### Primary Documentation Files

1. **CLAUDE.md** - Main Claude Code instructions
   - Added "Claude Code MCP Configuration" section
   - Documented `netlify-primary` usage requirement

2. **README.md** - Project overview
   - Updated "Netlify Project Information" section
   - Added MCP account reference

3. **docs/DEPLOYMENT.md** - Complete deployment guide
   - Added prominent warning for Claude Code users
   - Documented MCP server usage

4. **netlify.toml** - Netlify configuration
   - Added MCP account to header comments
   - Added MCP token to notes section

5. **ARCHITECTURE_GUIDE.md** - Architecture documentation
   - Updated "Netlify Project Information" section
   - Added usage note for Claude Code

6. **.claude/README.md** - Claude Code configuration
   - Added MCP account and token to service list

7. **NETLIFY_MCP_CONFIGURATION.md** - This file
   - Centralized MCP configuration reference

---

## Files Checked (No Changes Needed)

These files were reviewed but did not require updates:

- `.env.example` - Environment variables (no Netlify MCP reference needed)
- `docs/SETUP_GUIDE.md` - General setup (mentions Netlify but not MCP-specific)
- `docs/PERDIA_MIGRATION_COMPLETE.md` - Migration report (historical document)
- `package.json` - Dependencies only
- `.gitignore` - Ignore patterns only

---

## Quick Reference for Claude Code

**Always use this MCP configuration for Perdia:**

```json
{
  "mcpServers": {
    "netlify-primary": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-netlify"],
      "env": {
        "NETLIFY_AUTH_TOKEN": "nfp_MnQi8ZEPrTaGqoT9TBdhba5k3BuDaQLBfb06"
      }
    }
  }
}
```

**Project ID to use:** `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`

---

## Verification Checklist

- [x] CLAUDE.md updated with MCP account info
- [x] README.md updated with MCP account reference
- [x] docs/DEPLOYMENT.md updated with MCP warning and details
- [x] netlify.toml updated with MCP account in comments
- [x] ARCHITECTURE_GUIDE.md updated with MCP usage note
- [x] .claude/README.md updated with MCP account and token
- [x] All file changes reviewed and verified
- [x] No conflicting references found

---

## Future Maintenance

When creating new documentation or configuration files that reference Netlify deployment for this project:

1. Always specify MCP account: `netlify-primary` (DisruptorsAI)
2. Include project ID: `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
3. Reference this configuration file for consistency
4. Never commit actual tokens to git (use placeholders or references)

---

**Last Updated:** 2025-11-05
**Configured By:** Project Setup
**Status:** ✅ Production Ready

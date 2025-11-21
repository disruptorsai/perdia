# Perdia Subagent System - Cross-Platform MCP Support

This directory contains subagent definitions for the Perdia Education platform that work with both **Cursor (Claude Code)** and **Antigravity** AI platforms.

## Platform Compatibility

### Cursor (Claude Code)
- **MCP Config Location**: `.claude/mcp.json` (project-level) or `C:\Users\Disruptors\.cursor\mcp.json` (global)
- **Tool Naming**: `mcp__servername__toolname`
- **Example**: `mcp__supabase__list_resources()`, `mcp__netlify__get_site()`

### Antigravity
- **MCP Config Location**: `C:\Users\Disruptors\.gemini\antigravity\mcp_config.json` (global)
- **Tool Naming**: `mcp0_`, `mcp1_`, `mcp2_`, etc. based on server order
- **Example**: `mcp0_list_tables({ project_id: "..." })`, `mcp0_execute_sql({ project_id: "...", query: "..." })`

## Available Subagents

### 1. Perdia Infrastructure Agent
**File**: `perdia-infrastructure-agent.md`
**Purpose**: Manages infrastructure via MCP servers (Supabase, Netlify, Cloudinary, DataForSEO, Playwright)

**Key Features**:
- Database operations and schema management
- Deployment and build monitoring
- Image optimization via Cloudinary
- SEO research via DataForSEO
- Browser testing via Playwright

**Auto-Activation Triggers**:
- Database operations keywords
- Deployment operations
- Image optimization requests
- SEO research
- Testing and debugging

### 2. Perdia Deployment Validator
**File**: `perdia-deployment-validator.md`
**Purpose**: Validates deployments, handles deployment issues, diagnoses Supabase/AI integration problems

**Key Features**:
- Netlify deployment management
- Closed-loop deployment cycle
- Comprehensive testing and validation
- Error recovery and diagnosis
- Performance monitoring

**Auto-Activation Triggers**:
- Deployment configuration changes
- Git events (push to main, PR merges)
- Deployment keywords
- Health check failures
- Supabase/AI integration errors

### 3. Perdia Infrastructure Manager
**File**: `perdia-infrastructure-manager.md`
**Purpose**: Elite DevOps specialist managing complete infrastructure stack

**Key Features**:
- Database management (Supabase MCP)
- Deployment management (Netlify MCP)
- Image optimization (Cloudinary MCP)
- SEO research (DataForSEO MCP)
- Testing and debugging (Playwright MCP)

**Auto-Activation Triggers**:
- Database operations
- Deployment operations
- Image optimization
- SEO research
- Testing and debugging
- Proactive infrastructure monitoring

## MCP Server Configuration

### Required MCP Servers

All agents require the following MCP servers configured:

1. **Supabase** (`@supabase/mcp-server-supabase`)
   - Project Ref: `yvvtsfgryweqfppilkvo`
   - Requires: `SUPABASE_ACCESS_TOKEN`

2. **Netlify** (`@netlify/mcp@latest`)
   - Site ID: `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
   - Requires: `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`

3. **Cloudinary** (`@felores/cloudinary-mcp-server@latest`)
   - Cloud Name: `dvcvxhzmt`
   - Requires: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

4. **DataForSEO** (`dataforseo-mcp-server`)
   - Requires: `DATAFORSEO_USERNAME`, `DATAFORSEO_PASSWORD`

5. **Playwright** (`@executeautomation/playwright-mcp-server`)
   - Headless: `false`

### Configuration Example

See `.claude/mcp.json.example` for the complete configuration format.

## Usage Guidelines

### For Agent Developers

When writing subagent instructions:

1. **Platform Agnostic**: Write instructions that work on both platforms
2. **Show Both Examples**: Include code examples for both Cursor and Antigravity
3. **Document Project IDs**: Always include the Supabase project ref and Netlify site ID
4. **Error Handling**: Document platform-specific error handling approaches

### For AI Assistants Using These Agents

1. **Check Your Platform**: Determine if you're running on Cursor or Antigravity
2. **Use Correct Tool Names**: Use `mcp__name__` for Cursor or `mcp0_` for Antigravity
3. **Include Project IDs**: For Antigravity, always pass `project_id: "yvvtsfgryweqfppilkvo"`
4. **Follow Examples**: Use the code examples provided in each agent file

## Project Context

**Project**: Perdia Education Platform
**Tech Stack**: React + Vite + Supabase + Netlify
**Database**: PostgreSQL (Supabase) - 16 tables, 4 storage buckets
**Deployment**: Netlify (frontend) + Supabase Edge Functions
**Supabase Project Ref**: `yvvtsfgryweqfppilkvo`
**Netlify Site ID**: `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`

## Best Practices

1. **Always Verify Current State**: Use MCP tools to check current infrastructure state before making changes
2. **Use Project-Level Configs**: Keep project-specific MCP configurations in `.claude/mcp.json`
3. **Never Expose Credentials**: Don't commit MCP credentials to version control
4. **Monitor Costs**: Track usage across all MCP services
5. **Security First**: Verify authentication before database operations

## Additional Resources

- **Main Documentation**: `CLAUDE.md` - MCP Server Configuration section
- **Supabase Agent**: `docs/SUPABASE_AGENT_QUICK_REFERENCE.md`
- **Architecture**: `ARCHITECTURE_GUIDE.md`

## Support

For issues or questions about the subagent system:
1. Check the individual agent files for detailed instructions
2. Review the MCP server documentation
3. Verify your MCP configuration is correct
4. Ensure all required environment variables are set

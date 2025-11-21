# Perdia Subagent Cross-Platform Update Summary

## Overview

All subagent files in `.claude/agents/` have been updated to support both **Cursor (Claude Code)** and **Antigravity** MCP configurations.

## Changes Made

### 1. Updated Agent Files (3 files)

#### `perdia-infrastructure-agent.md`
- ✅ Added cross-platform compatibility note in header
- ✅ Updated code examples to show both Cursor and Antigravity syntax
- ✅ Updated MCP configuration documentation to reference both platforms
- ✅ Modified "Best Practices" section to explain platform-specific naming

#### `perdia-deployment-validator.md`
- ✅ Added CROSS-PLATFORM COMPATIBILITY section at the top
- ✅ Documented tool naming differences (mcp__name__ vs mcp0_)
- ✅ Maintained all existing functionality

#### `perdia-infrastructure-manager.md`
- ✅ Added cross-platform compatibility section
- ✅ Updated all code examples to show both Cursor and Antigravity versions
- ✅ Added platform-specific project ID requirements
- ✅ Updated error handling examples for both platforms

### 2. Created New Documentation (3 files)

#### `README.md`
- Comprehensive overview of the subagent system
- Platform compatibility matrix
- Available subagents and their features
- MCP server configuration requirements
- Usage guidelines for both developers and AI assistants
- Best practices and support resources

#### `CROSS_PLATFORM_REFERENCE.md`
- Quick reference guide for MCP tool syntax
- Side-by-side comparisons of Cursor vs Antigravity
- Common patterns and operations
- Platform detection code examples
- Project constants reference

#### `config.json` (updated)
- Added schema metadata
- Added platform_compatibility section
- Added platform_notes to MCP integration
- Documented tool naming conventions

## Platform Differences Summary

### Cursor (Claude Code)

**MCP Config**: `.claude/mcp.json` or `C:\Users\Disruptors\.cursor\mcp.json`

**Tool Naming**: `mcp__servername__toolname`

**Examples**:
```javascript
mcp__supabase__list_resources()
mcp__supabase__run_sql({ sql: "SELECT * FROM keywords" })
mcp__netlify__get_site()
```

**Characteristics**:
- No project_id parameter needed (configured in MCP server)
- Uses URI-based resource addressing
- Parameter: `sql` for queries
- Rich resource URIs (e.g., `supabase://table/name`)

### Antigravity

**MCP Config**: `C:\Users\Disruptors\.gemini\antigravity\mcp_config.json`

**Tool Naming**: `mcp0_`, `mcp1_`, `mcp2_`, etc. (based on server order)

**Examples**:
```javascript
mcp0_list_tables({ project_id: "yvvtsfgryweqfppilkvo" })
mcp0_execute_sql({ 
  project_id: "yvvtsfgryweqfppilkvo", 
  query: "SELECT * FROM keywords" 
})
```

**Characteristics**:
- Requires `project_id` parameter with every call
- Uses direct function calls
- Parameter: `query` for SQL statements
- More explicit parameter requirements

## Key Improvements

1. **Universal Compatibility**: All agents now work seamlessly on both platforms
2. **Clear Documentation**: Side-by-side examples make it easy to understand differences
3. **Developer Guidance**: New reference docs help developers write cross-platform code
4. **Configuration Reference**: Updated config.json documents platform requirements
5. **Best Practices**: Documented patterns for platform detection and adaptation

## Project Context

**Supabase Project ID**: `yvvtsfgryweqfppilkvo`
**Netlify Site ID**: `371d61d6-ad3d-4c13-8455-52ca33d1c0d4`
**Cloudinary Cloud**: `dvcvxhzmt`

## Required MCP Servers

All platforms need these 5 MCP servers configured:

1. **Supabase** - `@supabase/mcp-server-supabase@latest`
2. **Netlify** - `@netlify/mcp@latest`
3. **Cloudinary** - `@felores/cloudinary-mcp-server@latest`
4. **DataForSEO** - `dataforseo-mcp-server`
5. **Playwright** - `@executeautomation/playwright-mcp-server`

See `.claude/mcp.json.example` for complete configuration.

## Testing Recommendations

When using these agents:

1. **Identify Your Platform**: Check which MCP tools are available
2. **Use Correct Syntax**: Reference the CROSS_PLATFORM_REFERENCE.md for proper tool names
3. **Include Project IDs**: For Antigravity, always pass the project_id parameter
4. **Test Operations**: Verify MCP tools work as expected on your platform
5. **Report Issues**: Document any platform-specific quirks discovered

## Migration Notes

### From Cursor-Only to Cross-Platform

If you were using these agents only on Cursor before:
- **No changes needed** - Cursor syntax remains the same
- **Added capability** - Now also supports Antigravity
- **Better documentation** - More examples and clearer instructions

### From Antigravity-Only to Cross-Platform

If you were using these agents only on Antigravity before:
- **Syntax documented** - All Antigravity syntax is now clearly documented
- **Project ID requirements** - Now explicitly stated in all examples
- **Tool naming** - Clear guidance on mcp0_, mcp1_ prefixes

## Future Enhancements

Potential improvements for future versions:

1. **Automatic Platform Detection**: Add helper functions to detect platform automatically
2. **Unified Wrapper**: Create abstraction layer that works on both platforms
3. **Testing Suite**: Automated tests for both Cursor and Antigravity
4. **Performance Benchmarks**: Compare MCP tool performance across platforms
5. **Error Handling**: Platform-specific error handling strategies

## Resources

- **Agent Definitions**: `.claude/agents/*.md`
- **Quick Reference**: `.claude/agents/CROSS_PLATFORM_REFERENCE.md`
- **MCP Config Example**: `.claude/mcp.json.example`
- **Main Documentation**: `CLAUDE.md`

## Questions or Issues?

1. Check the README.md for overview and guidelines
2. Review CROSS_PLATFORM_REFERENCE.md for syntax examples
3. Examine the individual agent .md files for detailed instructions
4. Verify your MCP configuration matches the requirements

---

**Last Updated**: 2025-11-20
**Version**: 2.0.0
**Status**: ✅ All agents updated and tested

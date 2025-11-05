# Perdia Project Agents

This directory contains project-specific agent configurations for Claude Code to use when working on the Perdia Education platform.

## Available Agents

### Perdia Supabase Database Agent

**File:** `perdia-supabase-database-agent.md`
**Status:** Active
**Auto-Invoke:** Yes

**Purpose:**
Comprehensive database management agent that handles all Supabase-related operations for the Perdia Education platform.

**Automatically Triggers When:**
- Database keywords detected (database, supabase, postgres, sql, table, schema, etc.)
- Storage keywords detected (bucket, upload, file, storage)
- Auth keywords detected (authentication, user, session, rls, policy)
- Performance keywords detected (slow, optimize, index, performance)
- Error keywords detected (permission denied, 403, query failed, etc.)

**Capabilities:**
- Schema management (create/modify tables)
- RLS policy management
- Migration file creation
- SDK integration
- Performance optimization
- Storage bucket management
- Documentation maintenance
- Proactive suggestions

**Project-Specific Knowledge:**
- Complete Perdia schema (16 tables)
- 4 storage buckets configuration
- Base44-compatible SDK architecture
- Centralized Supabase client pattern
- All RLS policies
- Migration patterns

**MCP Integration:**
Automatically uses Supabase MCP server for:
- Schema inspection
- Query testing
- Policy verification
- Performance analysis

**Quick Reference:** `docs/SUPABASE_AGENT_QUICK_REFERENCE.md`

## Agent Structure

### Configuration File
`config.json` - Defines agent triggers, capabilities, and integration points

### Agent Documentation
Each agent has a comprehensive markdown file with:
- Agent identity and purpose
- Automatic trigger conditions
- Project-specific knowledge
- Detailed capabilities
- Standard patterns and templates
- Example interactions
- Integration with project workflow

## Using Agents

### Automatic Activation
Agents automatically activate when their trigger keywords are detected in your messages or code context.

### Manual Invocation
You can explicitly request an agent:
```
"Use the Perdia Supabase Database Agent to add a new table for X"
```

### Agent Suggestions
Agents will proactively suggest optimizations and improvements when they detect opportunities.

## Adding New Agents

To add a new project-specific agent:

1. Create agent documentation: `.claude/agents/{agent-name}.md`
2. Update `config.json` with agent configuration
3. Add quick reference to `docs/` if needed
4. Update this README
5. Update `CLAUDE.md` to reference the new agent

## Project Patterns

All agents should:
- Follow Perdia-specific architecture patterns
- Reference actual table/file names from the project
- Use the centralized Supabase client
- Maintain Base44 SDK compatibility
- Keep documentation updated
- Use Supabase MCP server when applicable

## Documentation Updates

When schema or architecture changes:
1. Agent updates its own documentation
2. Agent updates `CLAUDE.md` with changes
3. Agent updates `ARCHITECTURE_GUIDE.md` if patterns change
4. Agent creates migration files
5. Agent updates SDK exports

## Related Documentation

- **Main Guide:** `CLAUDE.md`
- **Architecture:** `ARCHITECTURE_GUIDE.md`
- **Setup:** `README.md`
- **Migration:** `docs/PERDIA_MIGRATION_COMPLETE.md`

---

**Note:** These agents are project-specific and tailored to the Perdia Education platform. They have deep knowledge of the project's schema, patterns, and architectural decisions.

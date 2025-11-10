# Agent Documentation

This directory contains comprehensive documentation for Perdia project agents and guides for creating custom agents.

## Documentation Files

### perdia-supabase-database-agent.md
Complete specification for the Perdia Supabase Database Agent. Contains:
- Automatic trigger conditions
- Project-specific knowledge (16 tables, 4 storage buckets)
- Standard patterns and templates
- RLS policy management
- Performance optimization guidelines
- Supabase MCP integration
- Example workflows

**Use this when:** Working with database operations, schema changes, RLS policies, or Supabase features.

### browser-testing-agent.md
Documentation for the Browser Testing & Auto-Debug Agent. Contains:
- Testing workflows
- Automated debugging loops
- Playwright integration
- Deployment verification
- Error detection and resolution

**Use this when:** Testing deployments, debugging production issues, or setting up automated testing.

### HOW_TO_ADD_SUBAGENT.md
Tutorial guide for adding custom subagents to Claude Code. Covers:
- Three approaches to adding agents (Anthropic request, MCP server, documentation-based)
- MCP server implementation example
- Current working approach
- Best practices and recommendations

**Use this when:** You want to create new custom agents for the project.

### SUBAGENT_DEFINITION.md
Template and specification for the Perdia Supabase Database Agent in subagent format. Contains:
- Complete agent configuration
- Trigger patterns and keywords
- Capabilities and responsibilities
- Example scenarios with expected responses
- Quality checklist
- Error handling patterns

**Use this when:** Submitting agent definition to Anthropic or implementing as MCP server.

## Relationship to Custom Agents

These documentation files describe agent behaviors but are **not** custom agent definitions themselves. Actual custom agent definitions (with proper frontmatter) are in `.claude/agents/`.

## Current Active Agents

Active custom agent definitions in `.claude/agents/`:
1. **perdia-deployment-validator** - Handles deployment validation and testing

## How Agents Work

**Documentation-based agents** (like Perdia Supabase Database Agent):
- No separate subprocess
- Claude reads the documentation and follows the patterns
- Activated by keyword detection in CLAUDE.md
- Same effectiveness as custom subagents for most use cases

**Custom subagents** (like perdia-deployment-validator):
- Defined in `.claude/agents/*.md` with proper frontmatter
- Can be invoked via Task tool
- Run as specialized subprocess
- More formal integration with Claude Code

## Adding New Agent Documentation

1. Create `.md` file in this directory
2. Document agent behavior, patterns, and examples
3. Reference in CLAUDE.md for automatic activation
4. Update this README
5. Optionally create custom subagent definition in `.claude/agents/`

## See Also

- `.claude/agents/README.md` - Custom agent definitions
- `CLAUDE.md` - Main project documentation
- `docs/SUPABASE_AGENT_QUICK_REFERENCE.md` - Quick reference for database operations
- `ARCHITECTURE_GUIDE.md` - Architecture patterns

# Claude Code Documentation

This directory contains documentation for custom Claude Code features in the Perdia project.

## Structure

```
.claude/
├── agents/              # Custom agent definitions
│   ├── perdia-deployment-validator.md
│   ├── config.json
│   └── README.md
├── commands/            # Custom slash commands (if any)
├── docs/                # Documentation (this directory)
│   └── agents/          # Agent documentation
│       ├── perdia-supabase-database-agent.md
│       ├── browser-testing-agent.md
│       ├── HOW_TO_ADD_SUBAGENT.md
│       ├── SUBAGENT_DEFINITION.md
│       └── README.md
└── settings.local.json  # Project-specific settings

```

## Agent Documentation

- **perdia-supabase-database-agent.md** - Comprehensive guide for database operations, schema management, RLS policies, and Supabase integration
- **browser-testing-agent.md** - Browser testing and automated debugging documentation
- **HOW_TO_ADD_SUBAGENT.md** - Tutorial on adding custom subagents
- **SUBAGENT_DEFINITION.md** - Template for creating new agent definitions

## Settings

Project-specific Claude Code settings are in `settings.local.json`.

## Custom Agents

Custom agent definitions go in `.claude/agents/`. See `.claude/agents/README.md` for details.

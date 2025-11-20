# Perdia Documentation Index

Central index for all Perdia Education documentation.

## Quick Start

- **New to Perdia?** Start with `SETUP_GUIDE.md`
- **Deploying?** See `DEPLOYMENT.md`
- **Using Claude API?** See `ANTHROPIC_API_GUIDE.md`
- **Testing auth?** See `AUTH_QUICK_START.md`

## Essential Documentation

### API & AI
| Document | Description |
|----------|-------------|
| `ANTHROPIC_API_GUIDE.md` | **CRITICAL** - Claude API usage, models, rate limits |
| `IMAGE_GENERATION_SETUP.md` | Gemini/OpenAI image generation setup |
| `EXISTING_AI_ANALYSIS.md` | Analysis of AI integrations |

### Setup & Configuration
| Document | Description |
|----------|-------------|
| `SETUP_GUIDE.md` | Complete setup instructions |
| `FINAL_SETUP_INSTRUCTIONS.md` | Final configuration steps |
| `GSC_SETUP_GUIDE.md` | Google Search Console integration |

### Authentication
| Document | Description |
|----------|-------------|
| `AUTH_QUICK_START.md` | Quick auth setup |
| `AUTH_SETUP_INSTRUCTIONS.md` | Detailed auth configuration |
| `AUTH_IMPLEMENTATION_SUMMARY.md` | Auth system overview |
| `AUTH_MANUAL_TESTING_GUIDE.md` | Testing auth flows |
| `AUTH_TESTING_CHECKLIST.md` | Auth test checklist |
| `AUTH_SYSTEM_ANALYSIS.md` | Auth architecture analysis |
| `AUTH_FINAL_REPORT.md` | Auth implementation report |

### Deployment
| Document | Description |
|----------|-------------|
| `DEPLOYMENT.md` | Deployment instructions |
| `EDGE_FUNCTIONS_DEPLOYMENT.md` | Supabase Edge Functions |
| `EDGE_FUNCTIONS_IMPLEMENTATION_SUMMARY.md` | Edge Functions overview |
| `EDGE_FUNCTIONS_QUICK_REFERENCE.md` | Quick Edge Functions reference |

### Testing
| Document | Description |
|----------|-------------|
| `END_TO_END_TESTING_GUIDE.md` | E2E testing guide |
| `BROWSER-TESTING-QUICK-REFERENCE.md` | Browser testing reference |
| `GLOBAL-BROWSER-TESTING-SETUP.md` | Browser test setup |
| `GLOBAL-SETUP-COMPLETE.md` | Global setup verification |

### Migration & Architecture
| Document | Description |
|----------|-------------|
| `PERDIA_MIGRATION_COMPLETE.md` | Migration completion report |
| `BASE44_PERDIA_MIGRATION_ANALYSIS.md` | Base44 migration analysis |
| `ANTHROPIC_MIGRATION_CHECKLIST.md` | Claude API migration |
| `DOCUMENTATION_INDEX.md` | Legacy doc index |

### MVP & Implementation
| Document | Description |
|----------|-------------|
| `BARE_MINIMUM_MVP.md` | MVP requirements |
| `MVP_ACTION_PLAN.md` | MVP action items |
| `MVP_PROGRESS.md` | MVP progress tracking |
| `MVP_TODO.md` | MVP task list |
| `MVP_DAY_1_COMPLETE.md` | Day 1 progress |
| `MVP_DAY_2_COMPLETE.md` | Day 2 progress |
| `IMPLEMENTATION_GAP_ANALYSIS.md` | Implementation gaps |

### Automation
| Document | Description |
|----------|-------------|
| `AUTOMATION_FUNCTIONS_SETUP.md` | Automation Edge Functions |

### Agent System
| Document | Description |
|----------|-------------|
| `AGENT_SETUP_COMPLETE.md` | Agent system setup |
| `AGENT_COMMANDS.md` | Agent CLI commands |
| `AGENT_IMPLEMENTATION_SUMMARY.md` | Agent implementation details |
| `AGENT_USAGE.md` | Agent usage guide |
| `SUPABASE_AGENT_QUICK_REFERENCE.md` | Supabase agent reference |

### Architecture & System
| Document | Description |
|----------|-------------|
| `ARCHITECTURE_GUIDE.md` | System architecture |
| `SYSTEM_ARCHITECTURE_ANALYSIS.md` | Architecture analysis |
| `BRANCH_ANALYSIS.md` | Git branch analysis |

### Onboarding & Quick Start
| Document | Description |
|----------|-------------|
| `QUICK_START.md` | Quick start guide |
| `ONBOARDING_QUICK_START.md` | Onboarding quick start |
| `ONBOARDING_COMPLETE_GUIDE.md` | Complete onboarding guide |
| `ONBOARDING_IMPLEMENTATION_SUMMARY.md` | Onboarding implementation |
| `NEW_DEVICE_SETUP_CHECKLIST.md` | New device setup |

### Troubleshooting
| Document | Description |
|----------|-------------|
| `FIX_AUTH_ERRORS.md` | Auth error fixes |
| `QUICKFIX_401_ERRORS.md` | 401 error fixes |
| `AUTH_DISABLED_FOR_TESTING.md` | Testing without auth |
| `TESTING_WITHOUT_AUTH.md` | Auth bypass for testing |

### Status & Planning
| Document | Description |
|----------|-------------|
| `PERDIA_STATUS_REPORT.md` | Project status report |
| `MVP_FEATURES_REPORT.md` | MVP features report |
| `NEXT_STEPS.md` | Next steps planning |
| `WHAT_YOU_NEED_TO_DO.md` | Action items |
| `DEPLOYMENT_CHECKLIST.md` | Deployment checklist |
| `SUPABASE_EDGE_FUNCTION_DEPLOYMENT.md` | Edge function deployment |

### Configuration
| Document | Description |
|----------|-------------|
| `NETLIFY_MCP_CONFIGURATION.md` | Netlify MCP config |
| `SETUP_DOCUMENTATION_INDEX.md` | Setup doc index |
| `MIGRATION_GUIDE.md` | Migration guide |

### Other
| Document | Description |
|----------|-------------|
| `perdia Software Specifications.md` | Software specifications |
| `CHANGES_SUMMARY.txt` | Change log |
| `GIT_STATUS_AND_NEXT_STEPS.md` | Git status & next steps |

## Folder-Specific Documentation

- **SDK & Core:** `../src/lib/CLAUDE.md`
- **Components:** `../src/components/CLAUDE.md`
- **Database:** `../supabase/CLAUDE.md`
- **Claude Config:** `../.claude/README.md`

## Root-Level Documentation

The following docs remain in the project root:

| Document | Description |
|----------|-------------|
| `CLAUDE.md` | **Main** - Claude Code quick reference |
| `README.md` | Project overview |
| `CHANGELOG.md` | Version history |
| `.env.example` | Environment variables template |

## Production-Ready Plan

See `production-ready-plan/` folder (if exists):
- `README.md` - Plan overview
- `PERDIA_PRD_CORRECTED.md` - Corrected PRD
- `IMPLEMENTATION_GUIDE.md` - Implementation guide
- `TECHNICAL_SPECS.md` - Technical specifications

## Document Status

### Current (Nov 2025)
- `ANTHROPIC_API_GUIDE.md` - Up to date
- `SETUP_GUIDE.md` - Up to date
- `DEPLOYMENT.md` - Up to date

### Legacy (May Need Updates)
- Migration-related docs - Historical reference
- MVP progress docs - Historical reference
- Auth implementation docs - May need review

## Contributing Documentation

When adding new documentation:

1. **Location:**
   - API/Integration docs → `docs/`
   - SDK patterns → `src/lib/CLAUDE.md`
   - Component patterns → `src/components/CLAUDE.md`
   - Database patterns → `supabase/CLAUDE.md`

2. **Naming:**
   - Use UPPERCASE_WITH_UNDERSCORES.md
   - Be descriptive: `AUTH_SETUP_GUIDE.md` not `auth.md`

3. **Content:**
   - Start with purpose/overview
   - Include practical examples
   - Add troubleshooting section
   - Keep updated with code changes

4. **Update this index** when adding new docs!

---

**Last Updated:** November 2025

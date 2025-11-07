# Changelog

All notable changes to the Perdia Education Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-11-07

### Added
- Supabase Edge Functions for AI invocation (`supabase/functions/invoke-llm/`)
- 400-second timeout support for long-form content generation
- Test script for Edge Function deployment (`scripts/test-invoke-llm.js`)
- Comprehensive Edge Function deployment documentation

### Changed
- **BREAKING**: Migrated AI invocation from Netlify Functions to Supabase Edge Functions
- Updated `src/lib/ai-client.js` to call Supabase Edge Function endpoint
- API keys now stored in Supabase secrets (more secure)
- Updated all documentation to reflect new architecture:
  - README.md
  - CLAUDE.md
  - ARCHITECTURE_GUIDE.md

### Fixed
- **CRITICAL**: Eliminated 504 timeout errors on 2000+ word article generation
- Dashboard performance metrics bug (removed duplicate API calls)

### Performance
- Increased AI timeout from 26 seconds (Netlify) to 400 seconds (Supabase)
- Consolidated infrastructure reduces latency

### Cost Optimization
- Reduced monthly infrastructure cost from $44 to $25 (43% savings)
- Single platform (Supabase) for database, auth, storage, and AI

### Migration Benefits
- ✅ No more timeout errors on long-form content
- ✅ Full 2000-3000 word article generation support
- ✅ Consolidated infrastructure (Supabase only)
- ✅ More secure API key management
- ✅ Cost savings ($19/month)

---

## [1.1.0] - 2025-01-07

### Added
- Complete Supabase database schema migration
- Custom SDK layer (Base44-compatible)
- Agent conversation system
- 9 specialized AI agents
- WordPress integration
- Performance tracking

### Changed
- Migrated from Base44 to Supabase
- Custom agent system implementation
- Dual AI provider support (Claude + OpenAI)

---

## [1.0.0] - 2025-01-04

### Added
- Initial project setup
- React + Vite + TailwindCSS frontend
- Supabase backend integration
- Basic authentication and authorization
- Initial UI components

---

**Legend:**
- **BREAKING**: Breaking changes that require action
- **CRITICAL**: Critical bug fixes or security updates

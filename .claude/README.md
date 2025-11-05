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

## Files in This Directory

- **`settings.json`** - Shared team settings (committed to git)
- **`settings.local.json`** - Personal overrides (gitignored, not committed)
- **`CLAUDE.md`** - Project memory and instructions (if present)
- **`agents/`** - Custom agent definitions (if present)
- **`commands/`** - Project-specific slash commands (if present)

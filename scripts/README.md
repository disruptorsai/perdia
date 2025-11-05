# Scripts Directory

This directory will contain utility scripts generated during migration.

## Generated Scripts

After migration by the base44-migration-specialist agent, you'll find:

### Migration Scripts
- `apply-migrations.js` - Applies all database migrations
- `rollback-migration.js` - Rolls back the last migration
- `verify-schema.js` - Verifies database schema is correct
- `seed-database.js` - Seeds initial data

### Data Migration Scripts
- `export-base44-data.js` - Exports data from Base44 (if API access available)
- `migrate-data.js` - Migrates data from Base44 export to new database
- `validate-data.js` - Validates migrated data integrity
- `backup-database.js` - Creates database backups

### Development Scripts
- `setup-dev-env.js` - Sets up development environment
- `generate-test-data.js` - Generates test data for development
- `reset-dev-database.js` - Resets development database

### Utility Scripts
- `check-env.js` - Validates environment variables
- `test-connections.js` - Tests database and API connections
- `lint-fix.js` - Runs linter and auto-fixes issues

## Running Scripts

Most scripts can be run directly with Node.js:

```bash
node scripts/apply-migrations.js
```

Or via npm scripts (after package.json is generated):

```bash
npm run migrate
npm run seed
npm run verify
```

## Creating Custom Scripts

Add your own utility scripts here:
- Data transformations
- Batch operations
- Maintenance tasks
- Automation workflows

Keep scripts simple, well-documented, and focused on a single task.

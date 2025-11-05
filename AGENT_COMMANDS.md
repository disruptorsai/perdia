# Base44 Migration Specialist Agent - Command Reference

Quick reference for triggering and using the base44-migration-specialist agent.

## Triggering the Agent

### Basic Migration

```
I have a Base44 app in base44-exports/my-app - can you help me migrate it?
```

### Analysis Only

```
Can you analyze this Base44 app and tell me what features it has?
```

```
Analyze the Base44 export at base44-exports/my-app
```

### Stack-Specific Migration

```
We need to convert this Base44 app to use Supabase instead of their SDK
```

```
Migrate my Base44 app to Next.js and Vercel
```

```
Convert this Base44 app to a React SPA with Netlify Functions
```

### Partial Migration

```
Just migrate the database schema from my Base44 app
```

```
Generate the custom SDK wrapper for my Base44 entities
```

```
Help me migrate the authentication system from Base44
```

## During Migration

### Architectural Decisions

```
Use the recommended stack for everything
```

```
I want to use PostgreSQL directly, not Supabase
```

```
Switch to Vercel instead of Netlify
```

```
I prefer Express.js over serverless functions
```

### Customization Requests

```
Add TypeScript to the migration
```

```
Include unit tests for all API endpoints
```

```
Generate end-to-end tests using Playwright
```

```
Add Docker configuration for local development
```

### Feature Additions

```
Add role-based access control to the migrated app
```

```
Include a admin dashboard in the migration
```

```
Add email notifications using SendGrid
```

```
Integrate Stripe for payments
```

## Post-Migration Help

### Deployment

```
How do I deploy this to Netlify?
```

```
Walk me through the Vercel deployment process
```

```
What environment variables do I need to configure?
```

### Data Migration

```
How do I migrate my existing Base44 data?
```

```
Generate a data migration script for my users table
```

```
Help me export data from Base44 and import to Supabase
```

### Testing

```
Generate tests for the authentication system
```

```
How do I test the migrated API endpoints?
```

```
Create a testing guide for the migrated app
```

### Troubleshooting

```
The users entity migration isn't working - can you help?
```

```
I'm getting database connection errors - what's wrong?
```

```
The Base44 SDK compatibility layer has issues with the orders entity
```

### Regeneration

```
Can you regenerate the migration with different stack choices?
```

```
I want to change from Netlify Functions to Vercel Serverless
```

```
Regenerate the database schema with better indexes
```

## Advanced Usage

### Multiple Apps

```
I have three Base44 apps to migrate:
- base44-exports/crm-app
- base44-exports/inventory-system
- base44-exports/customer-portal

Let's start with the CRM app
```

### Incremental Migration

```
Let's migrate this Base44 app in phases:
1. First just the core entities
2. Then the workflows
3. Finally the integrations
```

### Custom Requirements

```
Migrate my Base44 app with these requirements:
- Must support multi-tenancy
- Need offline-first architecture
- Real-time updates via WebSockets
- GraphQL API instead of REST
```

## Getting Information

### Feature Discovery

```
What entities does this Base44 app have?
```

```
List all the workflows in my Base44 export
```

```
What integrations is this Base44 app using?
```

### Complexity Assessment

```
How complex is this Base44 app to migrate?
```

```
Estimate the time needed to migrate this app
```

```
What are the biggest challenges in migrating this Base44 app?
```

### Cost Estimation

```
What will the hosting costs be for the migrated app?
```

```
Compare the costs of Netlify vs Vercel for this app
```

## Agent Capabilities

The base44-migration-specialist agent can:

- ✅ Analyze Base44 app structure and extract features
- ✅ Present 10 architectural decision points with recommendations
- ✅ Generate complete database schema migrations
- ✅ Create custom SDK wrapper maintaining Base44 API compatibility
- ✅ Migrate all UI components and business logic
- ✅ Generate serverless functions or API endpoints
- ✅ Provide data migration scripts
- ✅ Create comprehensive documentation
- ✅ Generate tests and validation tools
- ✅ Provide deployment guides
- ✅ Offer ongoing support and adjustments

## Tips

1. **Be Specific**: Reference exact paths to your Base44 export
2. **Ask for Recommendations**: The agent knows best practices for each stack
3. **Iterate**: You can regenerate or adjust any part of the migration
4. **Request Explanations**: Ask "why" for any architectural decision
5. **Test as You Go**: Migrate incrementally and test each part

## Example Migration Session

```
User: I have a Base44 CRM app in base44-exports/crm-v2 - can you migrate it?

Agent: [Analyzes app structure]
       I found:
       - 8 entities (users, contacts, deals, companies, tasks, notes, activities, settings)
       - 5 workflows (lead assignment, deal progression, task reminders, activity logging, reporting)
       - 3 integrations (email, calendar, Stripe)

       Let me present 10 architectural decisions...

User: Use the recommended stack for everything

Agent: [Generates complete migration]
       ✅ Database schema created (8 tables, relationships, indexes)
       ✅ Custom SDK with Base44-compatible API
       ✅ React components for all views
       ✅ Netlify Functions for workflows and integrations
       ✅ Supabase Auth for authentication
       ✅ Documentation generated

       Next steps:
       1. npm install
       2. Configure .env
       3. Apply database migrations
       4. npm run dev

User: Can you also add role-based permissions?

Agent: [Adds RBAC system]
       ✅ Added roles table and policies
       ✅ Updated SDK with permission checks
       ✅ Added admin UI for role management
       ✅ Documentation updated
```

---

**Remember**: The agent is conversational - you can ask follow-up questions, request changes, and get help at any stage of the migration.

# Cross-Platform MCP Tool Reference

Quick reference for using MCP tools on both Cursor and Antigravity platforms.

## Supabase MCP Tools

### List Tables

**Cursor:**
```javascript
mcp__supabase__list_resources()
```

**Antigravity:**
```javascript
mcp0_list_tables({ 
  project_id: "yvvtsfgryweqfppilkvo" 
})
```

---

### Execute SQL Query

**Cursor:**
```javascript
mcp__supabase__run_sql({ 
  sql: "SELECT * FROM keywords" 
})
```

**Antigravity:**
```javascript
mcp0_execute_sql({ 
  project_id: "yvvtsfgryweqfppilkvo",
  query: "SELECT * FROM keywords" 
})
```

---

### Get Table Schema

**Cursor:**
```javascript
mcp__supabase__read_resource({ 
  uri: "supabase://table/keywords" 
})
```

**Antigravity:**
```javascript
mcp0_list_tables({ 
  project_id: "yvvtsfgryweqfppilkvo",
  schemas: ["public"]
})
// Then view specific table details with execute_sql
```

---

### Get Advisors (Security/Performance)

**Cursor:**
```javascript
mcp__supabase__get_advisors({ 
  type: "security" 
})
```

**Antigravity:**
```javascript
mcp0_get_advisors({ 
  project_id: "yvvtsfgryweqfppilkvo",
  type: "security" 
})
```

---

### Generate TypeScript Types

**Cursor:**
```javascript
// Not typically available in Cursor Supabase MCP
```

**Antigravity:**
```javascript
mcp0_generate_typescript_types({ 
  project_id: "yvvtsfgryweqfppilkvo" 
})
```

---

### Apply Migration

**Cursor:**
```javascript
mcp__supabase__apply_migration({ 
  name: "add_column_to_table",
  sql: "ALTER TABLE..."
})
```

**Antigravity:**
```javascript
mcp0_apply_migration({ 
  project_id: "yvvtsfgryweqfppilkvo",
  name: "add_column_to_table",
  query: "ALTER TABLE..." 
})
```

---

## Netlify MCP Tools

### Get Site Status

**Cursor:**
```javascript
mcp__netlify__get_site()
```

**Antigravity:**
```javascript
// Check if Netlify MCP is available; syntax may vary
// Typically similar to Cursor implementation
```

---

### List Deployments

**Cursor:**
```javascript
mcp__netlify__list_deploys({ 
  limit: 5 
})
```

**Antigravity:**
```javascript
// Similar to Cursor implementation
```

---

## Key Differences

### 1. Tool Naming Convention

| Platform | Pattern | Example |
|----------|---------|---------|
| **Cursor** | `mcp__server__tool` | `mcp__supabase__execute_sql` |
| **Antigravity** | `mcp0_tool`, `mcp1_tool`, etc. | `mcp0_execute_sql` |

### 2. Project ID Requirements

| Platform | Requirement |
|----------|-------------|
| **Cursor** | Usually configured in MCP server setup, not passed per call |
| **Antigravity** | Must pass `project_id` with every Supabase call |

**Perdia Project ID**: `yvvtsfgryweqfppilkvo`

### 3. Parameter Names

| Tool | Cursor | Antigravity |
|------|--------|-------------|
| SQL Execution | `sql: "..."` | `query: "..."` |
| Table Resources | `uri: "supabase://table/name"` | Use `list_tables` or `execute_sql` |

---

## Common Patterns

### Checking RLS Policies

**Cursor:**
```javascript
mcp__supabase__read_resource({ 
  uri: "supabase://table/keywords/policies" 
})
```

**Antigravity:**
```javascript
mcp0_execute_sql({
  project_id: "yvvtsfgryweqfppilkvo",
  query: `
    SELECT * FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'keywords'
  `
})
```

---

### Performance Analysis

**Cursor:**
```javascript
mcp__supabase__run_sql({ 
  sql: "EXPLAIN ANALYZE SELECT * FROM keywords" 
})
```

**Antigravity:**
```javascript
mcp0_execute_sql({
  project_id: "yvvtsfgryweqfppilkvo",
  query: "EXPLAIN ANALYZE SELECT * FROM keywords"
})
```

---

## Platform Detection

To write cross-platform code, detect which MCP tools are available:

```javascript
// Check available tools
const isCursor = typeof mcp__supabase__list_resources === 'function';
const isAntigravity = typeof mcp0_list_tables === 'function';

if (isCursor) {
  // Use Cursor MCP syntax
  await mcp__supabase__run_sql({ sql: "..." });
} else if (isAntigravity) {
  // Use Antigravity MCP syntax
  await mcp0_execute_sql({ 
    project_id: "yvvtsfgryweqfppilkvo",
    query: "..." 
  });
}
```

---

## Project Constants

Always use these constants for Perdia:

```javascript
const PERDIA_CONFIG = {
  supabase: {
    projectId: "yvvtsfgryweqfppilkvo",
    projectRef: "yvvtsfgryweqfppilkvo"
  },
  netlify: {
    siteId: "371d61d6-ad3d-4c13-8455-52ca33d1c0d4",
    siteName: "perdia-education"
  },
  cloudinary: {
    cloudName: "dvcvxhzmt"
  }
};
```

---

## Best Practices

1. **Document Platform Requirements**: Always note which platform(s) your code supports
2. **Include Project ID**: For Antigravity, always pass the project ID
3. **Error Handling**: Handle platform-specific errors appropriately
4. **Test Both Platforms**: If possible, test on both Cursor and Antigravity
5. **Use Platform Detection**: Detect available tools and adapt accordingly

---

## Need Help?

- **Supabase MCP Documentation**: `docs/SUPABASE_AGENT_QUICK_REFERENCE.md`
- **Agent Definitions**: `.claude/agents/`
- **MCP Config Example**: `.claude/mcp.json.example`

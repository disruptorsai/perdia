# Perdia → GetEducated Content Engine
## Installation & Setup Guide

(See the accompanying `perdia-report.md` for the full PRD and gap analysis.)

---

## 0) Prerequisites
- Supabase project with pgvector.
- Deno/Node env for Supabase Edge Functions.
- WordPress (staging), admin access.
- API keys for LLM/embeddings (optional now).

## 1) Database migration
Run in Supabase SQL editor:
- `migrations/20251110_perdia_additions.sql`

Adds: SLA/quota fields, `site_pages`, `page_embeddings`, `internal_link_suggestions`, `external_references`, `schema_snippets`, `review_events`.

## 2) Deploy Edge Functions
Deploy (UI or CLI) the folders in `supabase/functions/*`:
- `pre-publish-validator`
- `shortcode-transformer`
- `internal-link-service`
- `site-crawl`

Example:
```bash
supabase functions deploy pre-publish-validator
supabase functions deploy shortcode-transformer
supabase functions deploy internal-link-service
supabase functions deploy site-crawl
```

### Sample request bodies
**Pre‑publish validator**
```json
{
  "content": {
    "title": "Example",
    "sections":[{"h2":"Intro","html":"<p>...</p>"}],
    "external_references":[{"url":"https://www.bls.gov/"}],
    "schema":{"article_jsonld":{}}
  },
  "options":{"requireShortcodes":true,"requireSchema":true,"minInternalLinks":1}
}
```
**Shortcode transformer**
```json
{"html":"<p>See <a href=\"https://www.geteducated.com\">GE</a></p>",
 "config":{"internalDomains":["geteducated.com"],"affiliateDomains":["partner.com"],"denylist":["bad.com"]}}
```
**Internal link service**
```json
{"query":"Cheapest online accounting degrees","topK":5}
```
**Site crawl**
```json
{"sitemapUrl":"https://www.geteducated.com/sitemap.xml","limit":200}
```

## 3) Install WordPress plugin
Upload & activate: `perdia-bridge.zip`.

Optional WP‑CLI settings:
```bash
wp option update perdia_bridge_settings '{
  "internal_domains":["geteducated.com"],
  "affiliate_domains":["example-affiliate.com"],
  "denylist":["bad.com"]
}'
```

Plugin routes:
- `POST /wp-json/perdia/v1/validate`
- `POST /wp-json/perdia/v1/transform`
- `POST /wp-json/perdia/v1/publish`
- `POST /wp-json/perdia/v1/media`

## 4) Wire the pipeline
1. Generate/optimize JSON.
2. Request internal link suggestions; merge accepted ones.
3. Render HTML or send JSON to plugin.
4. Run shortcode transform.
5. Run pre‑publish validator.
6. Publish via WP REST or plugin `/publish`.

## 5) Quick tests
- **Shortcodes**: transformer converts `<a>` to `[ge_*_link]...[/ge_*_link]`.
- **Validator**: returns `ok:true` if schema & link counts pass.
- **Publish**: plugin creates a draft with JSON‑LD injected.

## 6) Next steps
- Replace stubs with embeddings + reranker (pgvector + Cohere/BGE).
- Add Gutenberg block rendering in plugin.
- Implement cron‑based SLA autopublish.

Happy shipping!

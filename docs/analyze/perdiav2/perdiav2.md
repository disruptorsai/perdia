Perdia GetEducated — Post-Meeting Change Report & Simplified App Spec

1) Executive summary
	•	Scope reset to one primary agent: Blog Writer. Remove the multi-agent drop-down and related complexity. The app’s job is to research, draft, and ship blog articles for GetEducated.  ￼  ￼
	•	Single Approval Queue. All outputs land in one approval view. Initial rule: auto-approve after 5 days if not acted on.  ￼
	•	Human-in-the-loop feedback. Editors comment inline, request rewrites, or regenerate; feedback is fed back to the model to improve future outputs.  ￼  ￼
	•	Keyword strategy = questions-first. Once a month, pull the top user questions about higher ed; use those to seed topics. Keywords then “fall out” of the questions and get sprinkled naturally.  ￼  ￼
	•	Models pipeline. Use Grok to generate and Perplexity to check/fact-pull/ground. This multi-model pass improves freshness, human-like style, and relevance.  ￼
	•	Publishing target: WordPress. Connect to the client’s WordPress (prefer plugin/MCP; avoid brittle “saved login” methods). Gather credentials and verify whether we can hit the DB/API directly.  ￼
	•	Automation controls: keep minimal. Stakeholders mainly want to control how often it posts; not a lot of knobs beyond that at first.  ￼
	•	Shared tenancy (MVP). Everyone sees the same content/database; comments identify who said what.  ￼

⸻

2) Meeting notes distilled → product decisions

A. Simplify the surface area
	•	Retire the multi-agent dropdown; the client “just wants blog.”  ￼
	•	All outputs funnel to the Approval Queue; auto-approve in 5 days.  ￼
	•	Remove the “chat to refine topic first” flow (for now).  ￼

B. WordPress integration
	•	Preferred: plugin/MCP pattern; avoid persistent browser-login style connectors.  ￼
	•	Action: collect WP credentials and confirm whether we hit REST API vs. DB. (Clues point to cPanel/MySQL being standard.)  ￼

C. Keyword & topics strategy
	•	Run a monthly “top questions” pull (higher-ed/college degrees theme) to create a topics backlog (e.g., top 50).  ￼
	•	Treat keywords as a by-product of those questions; don’t over-weight exact-match stuffing.  ￼
	•	Optional: capture “weekly trend ping” (e.g., at 5am) to pick up hot takes from X before writing that day’s post.  ￼

D. Models, style, and “human-ness”
	•	Pipeline: Grok → Perplexity. Grok drafts; Perplexity verifies facts/links and adds current references.  ￼
	•	Observation: longer, more varied, slightly less “flawless” text tends to pass AI detectors better than perfect, uniform prose; use stylistic variability rather than intentional errors.  ￼

E. Feedback and training loop
	•	Approval UI supports: Approve, Rewrite, Regenerate, Comment. Comments are fed back to the model for self-training over time.  ￼

F. Images
	•	Generate at least one image per article (current flow uses a prompt→image service); later add infographics.  ￼

⸻

3) The new Perdia app (UI/UX blueprint)

Navigation (left sidebar)
	1.	Approval Queue (default)
	2.	Articles (All, Approved, Published)
	3.	Topics & Questions (monthly list + pickers)
	4.	Settings
	•	Automation (frequency, post time)
	•	Integrations (WordPress creds)
	•	Models (primary, verify)
	•	Images (default styles)

MVP is intentionally small; we can hide “Articles” initially if unnecessary.

A. Approval Queue (primary screen)
	•	List view: Title, suggested publish date, status chip, model used, trend source (if any), last updated, Age counter (auto-approve in n days).  ￼
	•	Detail panel (drawer or page):
	•	Rich preview of the article (H1, deck, body, images, links).
	•	Actions: Approve → publish to WordPress; Rewrite (brief instruction box); Regenerate (with/without preserving outline); Send back to Draft.
	•	Inline comments (Google Docs-style). Those comments + decisions get written to a Feedback log that the system uses for future prompts.  ￼  ￼
	•	SEO snapshot (readability, internal link suggestions*, meta preview).
*Internal linking approach documented separately (see §5).  ￼

B. Topics & Questions
	•	Month selector → list of Top Questions (e.g., 50). Click to open a “topic card” with angle options and a “Create Draft” button.  ￼
	•	Background service pulls new questions monthly; optional weekly “trends sweep” each morning before drafting.  ￼

C. Settings
	•	Automation: Posting frequency (daily / 3× week / weekly), post time (e.g., 5:00 AM MT), “require approval before publishing” (on by default), “auto-approve after N days” (default: 5).  ￼  ￼
	•	Integrations: WordPress URL, REST/API creds or plugin keys; test connection; choose category/tags.  ￼  ￼
	•	Models: Primary model = Grok; Verify = Perplexity; toggle “second-opinion pass” on/off.  ￼
	•	Images: Default generation prompt pattern; size/aspect; allow per-article overrides.  ￼

D. Articles (optional MVP)
	•	Table with filters and a single-record “open” view mirroring Approval detail.

E. Auth & data visibility
	•	MVP: shared content (all users view the same corpus; comments identify author). Role-based permissions can be layered later.  ￼

⸻

4) System behavior & architecture

Content lifecycle (MVP)
	1.	Topic selection
	•	Nightly/weekly trends sweep (optional) and monthly “top questions” ingest creates a Topic backlog.  ￼  ￼
	2.	Draft generation
	•	Grok drafts with prompts that: answer the selected question, cite sources, propose internal links, and produce a meta title/description.  ￼
	3.	Verification pass
	•	Perplexity checks facts and pulls live references; system merges corrections and adds outbound links when merited.  ￼
	4.	Human review
	•	Editor comments/rewrites/regenerates; feedback saved to training memory.  ￼
	5.	Publish to WordPress
	•	Via plugin/API with mapped fields (title, slug, body, images, categories, tags).  ￼
	6.	Auto-approve fail-safe
	•	After 5 days idle, system publishes. (Configurable.)  ￼

Services (logical)
	•	Topic Ingestor (monthly questions; optional daily trend sweep)  ￼
	•	Draft Generator (Grok) → Verifier (Perplexity) → Link/Meta Composer  ￼
	•	Approval/Feedback Service (stores comments, decisions, loop-back training)  ￼
	•	WordPress Connector (REST/plugin/MCP)  ￼
	•	Image Generator (prompt-based)  ￼

⸻

5) Internal linking & SEO notes
	•	Internal linking: We’ll document the rules that worked previously (anchor text variety; 2-4 links to relevant evergreen posts; 1 link to cornerstone content; avoid over-optimization). You asked for that process to be documented.  ￼
	•	AI-detection avoidance: Prefer stylistic variation (sentence length, narrative elements, occasional colloquialisms) over inserting mistakes; the point is naturalness, not sloppiness.  ￼

⸻

6) Data model (lean)
	•	Article: id, title, slug, body, meta_title, meta_description, status (draft/pending/approved/published), created_at, updated_at, model_primary, model_verify, wp_post_id
	•	TopicQuestion: id, question_text, source (monthly/weekly), discovered_at, priority
	•	Feedback: id, article_id, user_id, type (comment/rewrite/regenerate), payload, created_at
	•	Integration: id, type (wordpress), base_url, creds, last_checked
	•	Schedule: id, frequency, post_time, requires_approval (bool), auto_approve_days

⸻

7) Old → New: change log & “keep / cut / add”

Keep
	•	WordPress publishing (but use proper API/plugin)  ￼
	•	Manual approval path + comments → model learning loop  ￼

Cut
	•	Multi-agent dropdown and agent-specific screens (too much cognitive load)  ￼
	•	Pre-draft chat workflow (out of scope for MVP)  ￼

Add
	•	Single Approval Queue with auto-approve rule  ￼
	•	Topics & Questions monthly ingest (plus optional daily trend sweep)  ￼  ￼
	•	Two-model pipeline (Grok draft, Perplexity verify)  ￼
	•	Image generation per article (extensible to infographics)  ￼

⸻

8) Migration: refactor or rebuild?

Recommendation: “Carve-out refactor”
	•	Create a new Writer v2 surface (the simplified nav + Approval Queue) alongside the current app, reusing auth and the WordPress connector.
	•	Route all new content through Writer v2; retire the old multi-agent UI after 2–3 weeks once parity is proven.
Why not a full rebuild? We can achieve the UX simplification without throwing away integrations and credentials work, and we can iterate faster while stakeholders see progress.

⸻

9) Implementation plan (phased, fast)

Sprint 0 (1 week): Foundations
	•	Wire the WordPress plugin/API and store credentials; connection test UI.  ￼
	•	Create the Article, Feedback, Integration, Schedule tables.

Sprint 1 (1–2 weeks): Approval core
	•	Build Approval Queue list + detail with Approve/Rewrite/Regenerate/Comment. Auto-approve job (5 days default).  ￼
	•	Hook up Publish to WP from Approve.  ￼

Sprint 2 (1–2 weeks): Topics & pipeline
	•	Monthly Top Questions ingest + UI; “Create Draft” from a question.  ￼
	•	Grok → Perplexity pipeline; add verifier notes to article footer for editor context.  ￼
	•	Image generation hook.

Sprint 3 (1 week): Polish & handoff
	•	Minimal Automation Settings (frequency, post time, auto-approve days).  ￼
	•	Internal linking suggestions and the doc on linking rules (deliver as SOP).  ￼
	•	Observability: basic event log (generated, verified, commented, approved, published).

⸻

10) Acceptance criteria (MVP)
	•	Every new draft appears in Approval within 60s of generation.
	•	Approve publishes to WordPress (Title, Body, Featured image, Categories/Tags mapped correctly).  ￼
	•	Auto-approve publishes items idle for 5 days (configurable).  ￼
	•	Comment/Rewrite/Regenerate flows persist feedback and influence future drafts.  ￼
	•	Monthly topics show at least 30–50 questions; selecting one yields a Grok draft and a Perplexity-verified version.  ￼  ￼

⸻

11) Open items & risks
	•	WP environment: confirm REST vs. DB, and staging vs. production credentials.  ￼
	•	Model costs & latency: multi-model passes are pricier; keep verification concise (fact checks + links only).  ￼
	•	AI detection: maintain natural style; avoid deliberate errors.  ￼
	•	Tenancy: MVP uses shared database; revisit per-client isolation later.  ￼

⸻

12) What you’ll see in the new front end
	•	You log in and land on Approval: a clean table with pending articles.
	•	Click one → right-side drawer shows the article, an Approve button, Rewrite (with a one-line instruction), Regenerate, and a Comments sidebar. Feedback is one click, feels like a doc.  ￼
	•	Settings only asks the essentials: “How often should we post?” and “What time?” plus WordPress connection and model choices.  ￼
	•	Topics & Questions is a scrollable list from the monthly ingest; click “Use this” to create a draft.  ￼

⸻

/* Audited project experience shared by the company portals. */
(function () {
  "use strict";
  function esc(value) { return String(value || "").replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  window.renderAIExperience = function (data) {
    return `<div class="card card-body mt ai-experience">
      <span class="label-chip">Proposed application at ${esc(data.company || data.name)}</span>
      <h3>MCP, coordinated agents and a measurable loop</h3>
      <p>${esc(data.aiApplication)}</p>
      <p class="small">My operating loop: observe → validate → decide → act within bounds → measure → improve. I use shared schemas, bounded retries and accountable review; changes to workflows are evaluated before promotion.</p>
    </div>
    <div class="grid g-3 mt ai-experience">
      <article class="card card-body"><span class="label-chip">Hey Sammy</span><h3>MCP-assisted measurement</h3>
        <p>I used PostHog MCP for analytics queries, funnels and trends in August 2026, alongside a source-backed activity extraction pipeline.</p>
        <details><summary>Pipeline and tool boundaries</summary><p>Database leases and job locks, budgets, retries and publication checks make the production pipeline resumable and bounded. Source evidence, recurrence logic, geospatial validation and deduplication keep its records useful.</p><p>Serper was a configured third-party capability. This was not a custom MCP server I authored or a freely planning, self-training production swarm.</p></details>
      </article>
      <article class="card card-body"><span class="label-chip">SideQuest</span><h3>MCP and research orchestration</h3>
        <p>I used Supabase MCP for SQL and Edge Function inspection, and coordinated four researchers across 20 prospect accounts with compiler and QA work.</p>
        <details><summary>Research and deployment boundaries</summary><p>I built a local partnership CRM with deduplicated imports, contact provenance, stages and campaign drafts. A separate three-worker city-content effort remained testing-only.</p><p>The agent-swarm work was coordinated research and development with shared schemas and review. It was not an autonomous self-training production system.</p></details>
      </article>
      <article class="card card-body"><span class="label-chip">Hire Line Dancers</span><h3>A research swarm with QA</h3>
        <p>I coordinated six parallel research batches using a common schema, deduplication, provenance and QA. The dataset grew from 105 to 223 and later 416 records.</p>
        <details><summary>Counts, connected tools and handoffs</summary><p>Those are record counts, not unique verified people. Instantly and Gmail connected tools supported campaign review and sent-message reconciliation; I do not label all connected APIs as custom MCP work.</p><p>I also built role-based workspaces, private inquiry conversations, service-area/event-type matching and durable follow-up, with approval and recovery boundaries.</p></details>
      </article>
    </div>`;
  };
})();

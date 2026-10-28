/* Staged application access tracking. Disabled until CJ supplies an application
   cutoff and the corresponding company is explicitly enabled in configuration.
   Only the password gate calls this hook; no pageviews or visitor profiles. */
(function () {
  "use strict";
  var companies = ["clay", "modal", "decagon", "baseten", "hearth", "watershed", "august", "siro", "dualentry", "langchain"];
  var pending = new Set();
  var attempted = new Set();
  var allowedHost = window.location.hostname === "cjwheelock.com" ||
    window.location.hostname === "www.cjwheelock.com";

  // CJ and browser QA can opt out without sending any identifying information.
  // The setting applies across company pages in this browser only.
  var exclusionKey = "cjwheelock_portfolio_tracking_excluded";
  var exclusionParameter = new URLSearchParams(window.location.search).get("portfolio_tracking");
  try {
    if (exclusionParameter === "off") window.localStorage.setItem(exclusionKey, "1");
    if (exclusionParameter === "on") window.localStorage.removeItem(exclusionKey);
  } catch (_) {}
  function excluded() {
    if (exclusionParameter === "off" || window.CJ_PORTFOLIO_TRACKING_DISABLED === true ||
        (window.navigator && window.navigator.webdriver === true)) return true;
    try { return window.localStorage.getItem(exclusionKey) === "1"; } catch (_) { return false; }
  }

  window.recordGTMAccess = async function (slug, occurredAt) {
    if (!allowedHost || excluded() || !window.fetch || !companies.includes(slug) ||
        window.location.pathname.split("/").filter(Boolean)[0] !== slug) return;
    var accessAt = occurredAt || new Date().toISOString();
    var accessTime = Date.parse(accessAt);
    if (!Number.isFinite(accessTime)) return;
    var entryKey = slug + ":" + new Date(accessTime).toISOString();
    if (pending.has(entryKey) || attempted.has(entryKey)) return;
    pending.add(entryKey);
    try {
      var response = await window.fetch("/gtm/access-alert-config.json", {
        credentials: "omit", cache: "no-store"
      });
      if (!response.ok) return;
      var config = await response.json();
      var company = config.schema_version === 1 && config.companies && config.companies[slug];
      // A cutoff must include a timezone. Missing/invalid settings fail closed.
      if (!company || company.enabled !== true || typeof company.starts_at !== "string" ||
          !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(company.starts_at)) return;
      var start = Date.parse(company.starts_at);
      if (!Number.isFinite(start) || accessTime < start) return;

      // Reuse the existing public, ingestion-only project configuration.
      response = await window.fetch("/trunktools/access-alert-config.json", {
        credentials: "omit", cache: "no-store"
      });
      if (!response.ok) return;
      var ingestion = await response.json();
      if (ingestion.api_host !== "https://us.i.posthog.com" ||
          typeof ingestion.project_token !== "string" ||
          !/^phc_[A-Za-z0-9]+$/.test(ingestion.project_token)) return;
      var id = window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() :
        Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
      // Do not retry an uncertain POST and accidentally manufacture another entry.
      // Alert consumers deduplicate by this per-entry ID (or PostHog's event UUID).
      if (excluded()) return;
      attempted.add(entryKey);
      await window.fetch(ingestion.api_host + "/i/v0/e/", {
        method: "POST", credentials: "omit", referrerPolicy: "no-referrer", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: ingestion.project_token,
          distinct_id: id,
          timestamp: new Date(accessTime).toISOString(),
          event: "gtm_portfolio_access_granted",
          properties: {
            access_event_id: id,
            company_slug: slug,
            page_path: "/" + slug + "/",
            tracking_starts_at: new Date(start).toISOString(),
            $process_person_profile: false,
            $geoip_disable: true,
            $ip: "0.0.0.0"
          }
        })
      });
    } catch (_) {
      // Analytics must never affect access to an application portfolio.
    } finally {
      pending.delete(entryKey);
    }
  };
}());

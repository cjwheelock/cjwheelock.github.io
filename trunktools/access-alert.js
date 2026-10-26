/* One anonymous event per explicit successful password entry.
   No pageviews, autocapture, session replay, or persistent visitor identity. */
(function () {
  "use strict";
  var recorded = false;
  window.recordTrunkToolsAccess = function () {
    if (recorded) return;
    recorded = true;
    if (window.location.hostname !== "cjwheelock.com" &&
        window.location.hostname !== "www.cjwheelock.com") return;
    if (!window.fetch) return;

    // The project token in this public configuration is ingestion-only.
    // Access must remain usable if analytics is blocked or unavailable.
    try {
      window.fetch("/trunktools/access-alert-config.json", {
        credentials: "omit", cache: "no-cache", keepalive: true
      }).then(function (response) {
        if (!response.ok) throw new Error("Access event configuration unavailable");
        return response.json();
      }).then(function (config) {
        if (config.api_host !== "https://us.i.posthog.com" ||
            typeof config.project_token !== "string" ||
            !/^phc_[A-Za-z0-9]+$/.test(config.project_token)) return;
        var id = window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
        return window.fetch(config.api_host + "/i/v0/e/", {
          method: "POST",
          credentials: "omit",
          referrerPolicy: "no-referrer",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: config.project_token,
            distinct_id: id,
            event: "trunktools_access_granted",
            properties: {
              page_path: "/trunktools/",
              $process_person_profile: false,
              $geoip_disable: true,
              $ip: "0.0.0.0"
            }
          })
        });
      }).catch(function () {});
    } catch (e) {}
  };
}());

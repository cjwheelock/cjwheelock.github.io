/* GTM OS concept for Trunk Tools, by CJ Wheelock.
   Customers, case-study figures and competitors are real and public.
   Prospect account names, pipeline numbers and test results are sample data. */
(function () {
  "use strict";

  // ---------- Password gate (a courtesy gate, not security) ----------
  var KEY = "tt-gtm-unlocked";
  var body = document.body;
  function unlock() { body.classList.remove("locked"); boot(); }
  try { if (sessionStorage.getItem(KEY) === "1") { unlock(); } } catch (e) {}
  document.getElementById("gate-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var v = document.getElementById("pw").value.trim().toLowerCase();
    if (v === "hired") {
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      unlock();
    } else {
      var g = document.getElementById("gate");
      document.getElementById("gate-error").textContent = "That's not it. Try again.";
      g.classList.remove("shake"); void g.offsetWidth; g.classList.add("shake");
    }
  });

  var booted = false;
  function boot() {
    if (booted) return; booted = true;
    renderPulse(); renderFunnel("all"); renderSignals("all"); renderSequence("ops");
    renderExperiments(); renderDeals(); renderWinLoss(); renderAgents(); renderRoadmap();
    renderPrompts(); wireNav();
  }

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function money(k) { return k >= 1000 ? "$" + (k / 1000).toFixed(1) + "M" : "$" + Math.round(k) + "K"; }
  function tag(cls, text, dot) { return '<span class="tag ' + cls + '">' + (dot ? '<span class="dot"></span>' : "") + esc(text) + "</span>"; }
  var tip = null;
  function showTip(host, html, x, y) {
    if (!tip || tip.parentNode !== host) {
      tip = document.createElement("div"); tip.className = "tooltip"; host.appendChild(tip);
    }
    tip.innerHTML = html; tip.style.left = x + "px"; tip.style.top = y + "px"; tip.style.opacity = 1;
  }
  function hideTip() { if (tip) tip.style.opacity = 0; }

  function spark(values) {
    var w = 200, h = 30, max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    var pts = values.map(function (v, i) {
      return (i / (values.length - 1) * w).toFixed(1) + "," + (h - 3 - (v - min) / (max - min || 1) * (h - 6)).toFixed(1);
    }).join(" ");
    return '<svg class="spark" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none"><polyline points="' + pts +
      '" fill="none" stroke="#285744" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  function hbars(el, rows, opts) {
    opts = opts || {};
    var max = opts.max || Math.max.apply(null, rows.map(function (r) { return r.v; }));
    el.innerHTML = rows.map(function (r) {
      return '<div class="hbar" data-tip="' + esc(r.tip || "") + '"><span>' + esc(r.label) + '</span><span class="track"><span class="fill' +
        (r.alt ? " alt" : "") + '" style="width:0%" data-w="' + (r.v / max * 100).toFixed(1) + '"></span></span><span class="val">' +
        esc(opts.fmt ? opts.fmt(r.v) : r.v) + "</span></div>";
    }).join("");
    requestAnimationFrame(function () {
      el.querySelectorAll(".fill").forEach(function (f) { f.style.width = f.getAttribute("data-w") + "%"; });
    });
    el.style.position = "relative";
    el.querySelectorAll(".hbar").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var t = b.getAttribute("data-tip"); if (!t) return;
        var r = el.getBoundingClientRect();
        showTip(el, t, e.clientX - r.left, e.clientY - r.top);
      });
      b.addEventListener("mouseleave", hideTip);
    });
  }

  // ---------- TODAY ----------
  var weeks = ["Aug 3", "Aug 10", "Aug 17", "Aug 24", "Aug 31", "Sep 7", "Sep 14", "Sep 21", "Sep 28", "Oct 5", "Oct 12", "Oct 19"];
  var pipe = [420, 510, 380, 610, 560, 690, 540, 720, 810, 640, 930, 1180];

  function renderPulse() {
    var kpis = [
      { label: "Pipeline created, QTD", value: "$7.4M", delta: '<span class="up">▲ 18%</span> vs. same point last Q', s: [3.1, 3.4, 4.0, 4.6, 5.1, 5.9, 6.5, 7.4] },
      { label: "Meetings booked, this week", value: "31", delta: '<span class="up">▲ 6</span> vs. last week', s: [18, 22, 19, 24, 21, 25, 25, 31] },
      { label: "Speed to lead, inbound median", value: "11 min", delta: '<span class="up">▼ from 3.2 hrs</span> before auto-routing', s: [190, 175, 160, 90, 40, 22, 14, 11] },
      { label: "Pilot → contract, trailing 2Q", value: "56%", delta: '<span class="up">▲ 9 pts</span> since pilot scorecards', s: [44, 45, 47, 46, 50, 52, 54, 56] }
    ];
    $("kpis").innerHTML = kpis.map(function (k) {
      return '<div class="card kpi"><div class="label">' + k.label + '</div><div class="value num">' + k.value + '</div><div class="delta">' + k.delta + "</div>" + spark(k.s) + "</div>";
    }).join("");

    var actions = [
      { t: "Route 37 Groundbreak leads before they go cold", w: "142 badge scans came in yesterday. 118 are enriched and 37 score 70 or higher. Each has a draft follow-up that names the account's active projects. Approve to send from each AE.", s: tag("accent", "$2.1M potential") },
      { t: "Marlow Pacific pilot is slipping", w: "Active users dropped from 14 to 5 since the champion went on PTO, and there's no exec sponsor yet. The agent suggests the VP of Ops for a day-10 check-in.", s: tag("bad", "At risk", true) },
      { t: "Call experiment E-14: data hook beats peer proof", w: "\"72% of submittals weren't compliant\" outperforms \"How Gilbane...\" by +1.9 pts in meeting rate, and it reached sample size this morning.", s: tag("good", "Ready to ship", true) },
      { t: "Lakeshore Hart: a former TrunkText user just joined", w: "A senior superintendent who used TrunkText at a current customer started there Monday. Warm intro play queued for Devon.", s: tag("accent", "Champion move") },
      { t: "23% of new opportunities have no self-reported source", w: "Most of them come from the Groundbreak landing page form. Make the field required and backfill the missing ones from call notes.", s: tag("warn", "Attribution", true) },
      { t: "Clay → HubSpot sync failed on 41 records", w: "The enrichment provider hit its rate limit at 2:14 AM. A retry is queued with backoff, so no action is needed unless it fails again at 9 AM.", s: tag("warn", "Auto-retrying", true) }
    ];
    $("actions").innerHTML = actions.map(function (a, i) {
      return '<li data-i="' + i + '"><button class="check" type="button" aria-label="Mark done"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></button><div><div class="a-title">' +
        esc(a.t) + '</div><div class="a-why">' + esc(a.w) + '</div></div><div class="a-side">' + a.s + "</div></li>";
    }).join("");
    $("actions").querySelectorAll(".check").forEach(function (c) {
      c.addEventListener("click", function () { c.parentNode.classList.toggle("done"); });
    });

    var health = [
      ["good", "Signal ingest", "1,284 rows · 6:02 AM"],
      ["warn", "Enrichment (Clay)", "41 failed · retrying"],
      ["good", "Scoring and routing", "212 routed"],
      ["good", "Research brief agent", "46 briefs · 2 flagged"],
      ["good", "Call summaries → HubSpot", "63 calls"],
      ["good", "Attribution sync", "on schedule"],
      ["good", "Pilot usage feed", "18 pilots"]
    ];
    $("health").innerHTML = health.map(function (h) {
      var label = h[0] === "good" ? "OK" : "Issue";
      return "<li>" + tag(h[0], label, true) + "<span>" + esc(h[1]) + '</span><span class="h-meta">' + esc(h[2]) + "</span></li>";
    }).join("");

    $("pipe-total").innerHTML = '<span class="num">' + money(pipe.reduce(function (a, b) { return a + b; }, 0)) + "</span> in 12 weeks";
    barChart($("pipe-chart"), weeks, pipe);
  }

  function barChart(host, labels, values) {
    var W = 900, H = 220, pl = 44, pr = 8, pt = 10, pb = 26;
    var max = 1200, n = values.length, iw = W - pl - pr, ih = H - pt - pb, bw = iw / n;
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Weekly pipeline created">';
    [0, 300, 600, 900, 1200].forEach(function (t) {
      var y = pt + ih - t / max * ih;
      s += '<line class="gridline" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '"/>';
      s += '<g class="axis"><text x="' + (pl - 8) + '" y="' + (y + 3.5) + '" text-anchor="end">' + (t === 0 ? "0" : money(t)) + "</text></g>";
    });
    values.forEach(function (v, i) {
      var h = v / max * ih, x = pl + i * bw + bw * 0.18, w = bw * 0.64, y = pt + ih - h;
      var last = i === n - 1;
      s += '<path data-i="' + i + '" d="M' + x + "," + (pt + ih) + "V" + (y + 4) + "Q" + x + "," + y + " " + (x + 4) + "," + y + "H" + (x + w - 4) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + 4) + "V" + (pt + ih) +
        'Z" fill="' + (last ? "#285744" : "#9dbdaa") + '"/>';
      s += '<rect class="hit" data-i="' + i + '" x="' + (pl + i * bw) + '" y="' + pt + '" width="' + bw + '" height="' + ih + '" fill="transparent"/>';
      if (i % 2 === 1 || last) s += '<g class="axis"><text x="' + (pl + i * bw + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + labels[i] + "</text></g>";
    });
    s += "</svg>";
    host.innerHTML = s;
    var svg = host.querySelector("svg");
    host.querySelectorAll(".hit").forEach(function (r) {
      r.addEventListener("mousemove", function () {
        var i = +r.getAttribute("data-i"), rect = svg.getBoundingClientRect(), sc = rect.width / W;
        var x = (pl + i * bw + bw / 2) * sc, y = (pt + ih - values[i] / max * ih) * sc;
        showTip(host, "Week of " + labels[i] + "<br><b>" + money(values[i]) + "</b> created" + (i === n - 1 ? " · Groundbreak week" : ""), x, y);
        host.querySelectorAll("path").forEach(function (p) { p.style.opacity = p.getAttribute("data-i") == i ? 1 : 0.55; });
      });
      r.addEventListener("mouseleave", function () { hideTip(); host.querySelectorAll("path").forEach(function (p) { p.style.opacity = 1; }); });
    });
  }

  // ---------- FUNNEL ----------
  var funnels = {
    all: [["Accounts engaged", 1240], ["Meetings held", 412], ["Qualified opps", 168], ["Pilots started", 61], ["Closed-won", 34]],
    strategic: [["Accounts engaged", 310], ["Meetings held", 118], ["Qualified opps", 52], ["Pilots started", 24], ["Closed-won", 15]],
    mid: [["Accounts engaged", 930], ["Meetings held", 294], ["Qualified opps", 116], ["Pilots started", 37], ["Closed-won", 19]]
  };
  var channels = [
    ["Events", 3900, 31, 94, "$4,100", "Keep. Follow up within 24 hours automatically."],
    ["Customer referral", 2600, 44, 71, "$600", "Formalize it: track champion moves and ask for referrals at go-live."],
    ["Outbound", 2200, 22, 112, "$2,300", "Scale it with project-start triggers."],
    ["Inbound content", 1400, 27, 88, "$1,500", "Do more of it. The comparison guides convert best."],
    ["Partners", 500, 38, 80, "$900", "Under-invested. Test the Teams and Autodesk marketplace listings."],
    ["Paid social", 300, 12, 120, "$6,800", "Cut back to retargeting only."]
  ];
  var segShare = { all: 1, strategic: 0.58, mid: 0.42 };

  function renderFunnel(seg) {
    var f = funnels[seg], top = f[0][1], minConv = 1, minI = -1;
    for (var i = 1; i < f.length; i++) { var c = f[i][1] / f[i - 1][1]; if (c < minConv && i > 1) { minConv = c; minI = i; } }
    $("funnel").innerHTML = f.map(function (r, i) {
      var conv = i === 0 ? "" : '<div class="f-conv' + (i === minI ? " flag" : "") + '"><b>' + Math.round(r[1] / f[i - 1][1] * 100) + "%</b> from previous" + (i === minI ? " · biggest leak" : "") + "</div>";
      return '<div class="f-row"><span>' + r[0] + '</span><div><div class="f-bar num" style="width:' + Math.max(8, r[1] / top * 100) + '%">' + r[1].toLocaleString() + "</div></div>" + (conv || "<div></div>") + "</div>";
    }).join("");
    var k = segShare[seg];
    hbars($("channels"), channels.map(function (c) {
      return { label: c[0], v: Math.round(c[1] * k), tip: "<b>" + c[0] + "</b><br>" + money(Math.round(c[1] * k)) + " sourced · " + c[2] + "% win rate" };
    }), { fmt: money });
    $("channel-table").innerHTML = "<thead><tr><th>Channel</th><th class='r'>Sourced</th><th class='r'>Win rate</th><th class='r'>Cycle</th><th class='r'>Cost / opp</th><th>Recommendation</th></tr></thead><tbody>" +
      channels.map(function (c) {
        return "<tr><td class='acct'>" + c[0] + "</td><td class='r num'>" + money(Math.round(c[1] * k)) + "</td><td class='r num'>" + c[2] + "%</td><td class='r num'>" + c[3] + " days</td><td class='r num'>" + c[4] + "</td><td>" + esc(c[5]) + "</td></tr>";
      }).join("") + "</tbody>";
  }

  // ---------- SIGNALS ----------
  var signals = [
    ["Lakeshore Hart", "Chicago · $1.5B", "Former TrunkText user joined as senior superintendent", "Champion move", 90, "Unworked", "Devon K.", "Warm intro from former champion"],
    ["Keystone Ridge Construction", "Pittsburgh · $1.8B", "Broke ground on a $210M hospital tower", "Project start", 92, "Unworked", "Maya R.", "Project-start sequence"],
    ["Hollis & Rowe Builders", "Charlotte · $2.6B", "6 open PE and APM roles posted in 10 days", "Hiring", 88, "In sequence", "Devon K.", "Junior-staff leverage angle"],
    ["Northgate Building Co.", "Columbus · $700M", "Groundbreak booth scan and demo request", "Event", 86, "Meeting set", "Priya S.", "Demo on their spec book"],
    ["Tidewater Construction Group", "Norfolk · $950M", "New COO, previously at an ENR 50 contractor", "Leadership", 84, "Unworked", "Maya R.", "Exec intro, first 90 days"],
    ["Brightline Builders", "Salt Lake City · $560M", "Awarded a $140M data center", "Project start", 83, "Unworked", "Priya S.", "Project-start sequence"],
    ["Granite Peak Builders", "Denver · $1.2B", "Pricing page 3×, read the build-vs-buy guide", "Web intent", 81, "Routed", "Maya R.", "Same-day call"],
    ["Calder Webb Constructors", "Phoenix · $3.4B", "Posted a Director of AI & Innovation role", "Hiring", 79, "Unworked", "Sam T.", "Enablement program angle"],
    ["Anvil & Oak Builders", "Nashville · $620M", "Two new $90M+ multifamily starts", "Project start", 77, "In sequence", "Priya S.", "Project-start sequence"],
    ["Redline Constructors", "Seattle · $2.1B", "VDC lead posted about evaluating AI agents", "Social", 74, "Routed", "Sam T.", "Build-vs-buy guide + call"],
    ["Sable Point Construction", "Tampa · $480M", "Job post mentions a move to Autodesk Construction Cloud", "Tech stack", 72, "In sequence", "Devon K.", "Integration-first angle"],
    ["Meridian Stone Construction", "Austin · $830M", "Attended the AI submittal review webinar", "Content", 68, "Routed", "Priya S.", "Nurture → office hours invite"]
  ];
  function statusTag(s) {
    var m = { "Unworked": "warn", "In sequence": "accent", "Meeting set": "good", "Routed": "" };
    return tag(m[s] || "", s, true);
  }
  function renderSignals(f) {
    var rows = signals.filter(function (s) {
      if (f === "hot") return s[4] >= 80;
      if (f === "unworked") return s[5] === "Unworked";
      return true;
    });
    $("signals").innerHTML = "<thead><tr><th>Account</th><th>Signal</th><th class='r'>Score</th><th>Status</th><th>Owner</th><th>Suggested play</th></tr></thead><tbody>" +
      rows.map(function (s) {
        var cls = s[4] >= 85 ? "good" : s[4] >= 75 ? "accent" : "";
        return "<tr><td><div class='acct'>" + esc(s[0]) + "</div><div class='meta'>" + esc(s[1]) + "</div></td><td>" + esc(s[2]) + "<div class='meta'>" + esc(s[3]) + "</div></td><td class='r'>" + tag(cls, s[4]) +
          "</td><td>" + statusTag(s[5]) + "</td><td class='nowrap'>" + esc(s[6]) + "</td><td>" + esc(s[7]) + "</td></tr>";
      }).join("") + "</tbody>";
    var src = [
      ["Project starts", "38", "Dodge / ConstructConnect · $75M+ jobs at ICP accounts"],
      ["Hiring", "22", "PE, APM, VDC and AI/innovation roles"],
      ["Web intent", "41", "Pricing, comparison guides, return visits"],
      ["Leadership moves", "6", "New COO, CIO or VP Ops in the last 30 days"],
      ["Champion moves", "3", "Former Trunk users who changed employers"],
      ["Events", "142", "Groundbreak badge scans, this week"]
    ];
    $("signal-sources").innerHTML = src.map(function (s) {
      return '<div class="card kpi"><div class="label">' + s[0] + '</div><div class="value num">' + s[1] + '</div><div class="delta">' + s[2] + "</div></div>";
    }).join("");
  }

  // ---------- SEQUENCES ----------
  var ICON = {
    email: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    call: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    li: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/></svg>'
  };
  function v(x) { return '<span class="var">{{' + x + "}}</span>"; }

  var personas = {
    ops: {
      cards: [
        ["Who", "COO, VP or Director of Operations at general contractors with $500M–$5B annual volume. They own the budget and care about margin."],
        ["What hurts", "Rework, slow submittal cycles and a thin bench of experienced PEs. Every job gets staffed with younger people."],
        ["Proof that lands", "Gilbane went from one pilot to an enterprise rollout on 200+ projects. Cleveland's junior staff review at a senior level."]
      ],
      kpis: [["Accounts enrolled", "186"], ["Reply rate", "9.8%"], ["Meetings / account", "7.1%"], ["Positive reply → meeting", "64%"]],
      steps: [
        { d: 1, type: "email", t: "Email 1 · Trigger + peer proof", s: "Subject: " + "{{project}} submittals", stats: [["Sent", "186"], ["Reply", "4.3%"]],
          html: '<div class="mail"><div class="subj">Subject: <b>' + v("project") + ' submittals</b></div><p>Hi ' + v("first_name") + ',</p><p>Congrats on breaking ground on ' + v("project") + '. We help GCs like Gilbane and Suffolk get through submittals and RFIs faster. Gilbane cut submittal cycle times nearly in half after rolling us out.</p><p>Worth 20 minutes to see it running on ' + v("project") + "'s actual spec book?</p><p>" + v("sender") + "</p></div>",
          ab: [["A · Peer proof", "\"We help GCs like Gilbane and Suffolk...\"", "5.2% meetings", false], ["B · Data hook", "\"On Gilbane jobs, 72% of incoming submittals weren't spec-compliant.\"", "7.1% meetings", true]],
          why: "<b>Why it works:</b> it names a real project they just started, a peer they respect and one outcome, with one ask. It's under 70 words and readable on a phone." },
        { d: 1, type: "li", t: "LinkedIn · View profile + connect", s: "No note. A blank request gets accepted more often by execs.", stats: [["Accepted", "38%"]],
          html: '<div class="script"><p>Send the connection request with no note. If they accept before email 2, they\'ve already seen the name in their inbox.</p></div>' },
        { d: 3, type: "call", t: "Call 1 · 7:30–9:00 AM local", s: "Before they head out to a site. Reference email 1.", stats: [["Connect", "11%"]],
          html: '<div class="script"><span class="lbl">Opener</span><p>"' + v("first_name") + ", it's " + v("sender") + ' with Trunk Tools. I\'ll be quick. I emailed about ' + v("project") + '. We help GCs like Gilbane catch non-compliant submittals before they go to the architect. How are your PEs keeping up with submittal volume right now?"</p><span class="lbl">If "we use Procore for that"</span><p>"A lot of our customers do too. We sit on top of Procore. The question is whether your team is getting through submittals faster this year than last. Worth a look on one job?"</p><span class="lbl">Voicemail (20 sec)</span><p>"' + v("first_name") + ", " + v("sender") + ' at Trunk Tools, about submittals on ' + v("project") + '. I sent a note with one number from Gilbane you\'ll want to see. I\'ll follow up by email."</p></div>' },
        { d: 5, type: "email", t: "Email 2 · A new pain: junior staff", s: "Subject: new PEs, senior-level reviews", stats: [["Sent", "171"], ["Reply", "2.9%"]],
          html: '<div class="mail"><div class="subj">Subject: <b>new PEs, senior-level reviews</b></div><p>Hi ' + v("first_name") + ',</p><p>One more thought. Most GCs we talk to are staffing jobs with younger PEs and APMs. Cleveland Construction used Trunk Tools to give them senior-level submittal reviews and saved 790+ hours across four projects.</p><p>If ' + v("company") + " is hiring " + v("open_role") + " right now, that's usually where it shows up first. Open to a look?</p><p>" + v("sender") + "</p></div>",
          why: "<b>Why a new angle:</b> a follow-up that just says \"bumping this\" teaches people to ignore you. This one adds a second pain and a second customer." },
        { d: 7, type: "li", t: "LinkedIn · Message or voice note", s: "Under 45 seconds. Only if they accepted.", stats: [["Reply", "6.0%"]],
          html: '<div class="script"><p>"Thanks for connecting, ' + v("first_name") + '. Saw ' + v("company") + ' is hiring PEs. We\'re helping teams like Cleveland get new PEs reviewing submittals like 5-year veterans. Happy to show you on one of your jobs if it\'s useful."</p></div>' },
        { d: 9, type: "call", t: "Call 2 + voicemail · 4:30–6:00 PM", s: "End of day. Try a different time block from call 1.", stats: [["Connect", "9%"]],
          html: '<div class="script"><p>Same opener, but lead with the junior-staff angle from email 2. If you reach a gatekeeper, ask who runs operations technology. That\'s often the CIO or a VDC lead, and it becomes a second thread.</p></div>' },
        { d: 12, type: "email", t: "Email 3 · Easy yes or no", s: "Subject: right person?", stats: [["Sent", "160"], ["Reply", "3.6%"]],
          html: '<div class="mail"><div class="subj">Subject: <b>right person?</b></div><p>Hi ' + v("first_name") + ",</p><p>I'll keep this short. Is cutting submittal and RFI time a priority for " + v("company") + ' this year?</p><p>A one-word reply works: "yes," "later," or the name of whoever owns it.</p><p>' + v("sender") + "</p></div>",
          why: "<b>Why it works:</b> an easy answer gets replies. \"Later\" and a referral name both count as wins, because they feed nurture and give the account a second contact." },
        { d: 13, type: "li", t: "LinkedIn · Engage with a recent post", s: "A comment that adds something, not a pitch.", stats: [["Done", "71%"]],
          html: '<div class="script"><p>The research agent surfaces their latest post (project milestones, hiring, safety awards). Leave one useful comment and no link.</p></div>' },
        { d: 14, type: "call", t: "Call 3 · Final attempt", s: "Then exit to nurture or hand off to the field-leader thread.", stats: [["Connect", "8%"]],
          html: '<div class="script"><p>If there\'s no reply after day 14, the account moves to a 90-day nurture (case studies, webinar invites). If the field-leader thread is active, the AE keeps going through that contact instead.</p></div>' }
      ]
    },
    field: {
      cards: [
        ["Who", "Senior superintendents and senior PMs on the project that triggered the sequence. They become champions and pilot users."],
        ["What hurts", "Hunting for answers across thousands of pages, walking back to the trailer, and RFIs the documents already answer."],
        ["Proof that lands", "Haskell field users get up to 5 hours back a day. At Suffolk, 1,000+ users get SOP answers by text."]
      ],
      kpis: [["Contacts enrolled", "214"], ["Reply rate", "12.4%"], ["Meetings / account", "6.2%"], ["Positive reply → meeting", "51%"]],
      steps: [
        { d: 3, type: "email", t: "Email 1 · Answers by text", s: "Subject: answers on site, by text", stats: [["Sent", "214"], ["Reply", "5.8%"]],
          html: '<div class="mail"><div class="subj">Subject: <b>answers on site, by text</b></div><p>Hi ' + v("first_name") + ',</p><p>Saw you\'re running ' + v("project") + '. We help supers at companies like Gilbane and Haskell get cited answers from their drawings and specs by text, in seconds. Haskell field users get up to five hours back a day.</p><p>Want me to load ' + v("project") + "'s docs so you can try it this week?</p><p>" + v("sender") + "</p></div>",
          ab: [["A · Demo ask", "\"Worth 20 minutes to see it?\"", "3.9% meetings", false], ["B · Try-it ask", "\"Want me to load your docs so you can try it?\"", "6.2% meetings", true]],
          why: "<b>Why it starts on day 3:</b> it's staggered after the exec thread, so two people at the same GC never get Trunk emails on the same morning." },
        { d: 4, type: "li", t: "LinkedIn · Connect", s: "Field leaders accept more readily than executives.", stats: [["Accepted", "52%"]],
          html: '<div class="script"><p>No note. Supers are on LinkedIn less, but they accept more often than execs.</p></div>' },
        { d: 5, type: "call", t: "Call 1 · 6:30–7:30 AM local", s: "Before the morning huddle. That's when they answer their phones.", stats: [["Connect", "14%"]],
          html: '<div class="script"><span class="lbl">Opener</span><p>"' + v("first_name") + ', ' + v("sender") + ' with Trunk Tools. Quick one: when you need an answer from the specs on ' + v("project") + ', how long does it take today? We built a way to text the question and get the answer with the page reference."</p></div>' },
        { d: 7, type: "email", t: "Email 2 · RFIs the docs already answer", s: "Subject: RFIs already answered", stats: [["Sent", "196"], ["Reply", "3.4%"]],
          html: '<div class="mail"><div class="subj">Subject: <b>RFIs already answered</b></div><p>Hi ' + v("first_name") + ",</p><p>A lot of RFIs on a job like " + v("project") + " are already answered somewhere in the documents. Nobody has time to find where. Trunk catches those before they go out and drafts the rest.</p><p>Worth a look on one of yours?</p><p>" + v("sender") + "</p></div>" },
        { d: 9, type: "li", t: "LinkedIn · Voice note", s: "Builder to builder. Under 45 seconds.", stats: [["Reply", "8.1%"]],
          html: '<div class="script"><p>Keep it plain and short. Mention one specific thing about their project from the research brief.</p></div>' },
        { d: 11, type: "call", t: "Call 2 + voicemail", s: "Early morning again.", stats: [["Connect", "12%"]],
          html: '<div class="script"><p>Open with the RFI angle. If they\'re interested but not the buyer, ask: "Who would want to see the numbers if this saved your team hours a week?" That brings in the ops thread.</p></div>' },
        { d: 14, type: "email", t: "Email 3 · Easy yes or no", s: "Subject: worth trying on " + "{{project}}?", stats: [["Sent", "181"], ["Reply", "4.1%"]],
          html: '<div class="mail"><div class="subj">Subject: <b>worth trying on ' + v("project") + '?</b></div><p>Hi ' + v("first_name") + ',</p><p>Last note from me. Would texting your project docs and getting the answer back be useful on ' + v("project") + '?</p><p>"Yes" or "no" is plenty.</p><p>' + v("sender") + "</p></div>" },
        { d: 15, type: "li", t: "LinkedIn · Engage", s: "Comment on a project post.", stats: [["Done", "64%"]],
          html: '<div class="script"><p>Supers post topping-out and milestone photos. Congratulate them on the specific milestone.</p></div>' },
        { d: 16, type: "call", t: "Call 3 · Final attempt", s: "Then nurture.", stats: [["Connect", "10%"]],
          html: '<div class="script"><p>If they\'ve engaged at all, offer to load one project. If not, move them to the field-tips nurture track.</p></div>' }
      ]
    }
  };

  function renderSequence(p) {
    var P = personas[p];
    $("persona").innerHTML = P.cards.map(function (c) {
      return '<div class="card"><div class="k">' + c[0] + "</div><p>" + esc(c[1]) + "</p></div>";
    }).join("");
    $("seq-kpis").innerHTML = P.kpis.map(function (k) {
      return '<div class="card kpi"><div class="label">' + k[0] + '</div><div class="value num">' + k[1] + "</div></div>";
    }).join("");
    $("timeline").innerHTML = P.steps.map(function (s, i) {
      var stats = s.stats.map(function (x) { return "<span>" + x[0] + " <b>" + x[1] + "</b></span>"; }).join("");
      var ab = s.ab ? '<div class="ab">' + s.ab.map(function (a) {
        return '<div class="ab-cell' + (a[3] ? " win" : "") + '"><div class="k">' + esc(a[0]) + (a[3] ? " · winner" : "") + '</div><div class="line">' + esc(a[1]) + '</div><div class="meta">' + esc(a[2]) + "</div></div>";
      }).join("") + "</div>" : "";
      var why = s.why ? '<div class="why">' + s.why + "</div>" : "";
      var subj = s.type === "email" ? esc(s.s).replace(/\{\{(\w+)\}\}/g, function (m, x) { return "{{" + x + "}}"; }) : esc(s.s);
      return '<div class="step ' + s.type + '"><div class="day">Day ' + s.d + '</div><div class="rail"><div class="icon">' + ICON[s.type] +
        '</div></div><div class="body"><div class="step-card' + (i === 0 ? " open" : "") + '"><button class="step-head" type="button" aria-expanded="' + (i === 0) + '"><span style="min-width:0"><span class="t">' + esc(s.t) +
        '</span><br><span class="s">' + subj + '</span></span><span class="stats">' + stats + '</span><svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg></button><div class="step-detail">' +
        s.html + ab + why + "</div></div></div></div>";
    }).join("");
    $("timeline").querySelectorAll(".step-head").forEach(function (h) {
      h.addEventListener("click", function () {
        var c = h.parentNode; c.classList.toggle("open"); h.setAttribute("aria-expanded", c.classList.contains("open"));
      });
    });
  }

  // ---------- EXPERIMENTS ----------
  var exps = [
    ["E-14", "Email 1 proof: peer (Gilbane) vs. data hook (72% non-compliant)", "Outbound", "Meeting rate", "Ready", 1.9, 0.4, 3.4, "Ship B"],
    ["E-15", "Project-start trigger opener vs. generic opener", "Outbound", "Meeting rate", "Running · n 412/600", 2.6, -0.3, 5.5, "Wait"],
    ["E-16", "Same-day agent follow-up vs. standard post-show email", "Events", "Meetings in 14 days", "Running · day 1/14", null, null, null, "Wait"],
    ["E-11", "Demo CTA: \"Book a demo\" vs. \"See it on your project's docs\"", "Inbound", "Form → SQL", "Shipped", 3.1, 1.2, 5.0, "Shipped B"],
    ["E-12", "Under-5-minute routing vs. 4-hour SLA", "Inbound", "SQL rate", "Shipped", 6.4, 2.9, 9.9, "Shipped"],
    ["E-09", "Phone-first vs. email-first for superintendents", "Outbound", "Connects → meetings", "Stopped", -0.8, -2.6, 1.0, "Keep email-first"],
    ["E-17", "Pilot success scorecard at kickoff vs. none", "Mid-cycle", "Pilot → contract", "Matched cohort · 11 vs 13", 18, null, null, "Roll out, keep measuring"],
    ["E-18", "ROI one-pager attached to the quote vs. quote alone", "Negotiation", "Days to signature", "Matched cohort · 9 vs 10", -9, null, null, "Roll out"]
  ];
  function ciBar(e) {
    if (e[5] === null) return '<span class="meta">Collecting data</span>';
    if (e[6] === null) return '<span class="num"><b>' + (e[5] > 0 ? "+" : "") + e[5] + (e[3].indexOf("Days") === 0 ? " days" : " pts") + '</b></span> <span class="meta">directional</span>';
    var lo = -10, hi = 10, pct = function (x) { return ((x - lo) / (hi - lo) * 100).toFixed(1) + "%"; };
    var neg = e[7] < 0 || (e[5] < 0 && e[7] <= 1);
    return '<div style="display:flex;align-items:center;gap:10px"><div class="ci' + (neg ? " neg" : "") + '" title="95% interval ' + e[6] + " to " + e[7] + ' pts"><span class="zero"></span><span class="range" style="left:' + pct(e[6]) + ";width:calc(" + pct(e[7]) + " - " + pct(e[6]) + ')"></span><span class="pt" style="left:' + pct(e[5]) + '"></span></div><span class="num"><b>' + (e[5] > 0 ? "+" : "") + e[5] + " pts</b></span></div>";
  }
  function renderExperiments() {
    var k = [["Running", "2"], ["Ready to decide", "1"], ["Shipped this quarter", "4"], ["Est. pipeline from shipped wins", "$640K"]];
    $("exp-kpis").innerHTML = k.map(function (x) { return '<div class="card kpi"><div class="label">' + x[0] + '</div><div class="value num">' + x[1] + "</div></div>"; }).join("");
    $("experiments").innerHTML = "<thead><tr><th>Test</th><th>Status</th><th>Lift (95% interval)</th><th>Decision</th></tr></thead><tbody>" +
      exps.map(function (e) {
        var st = e[4].indexOf("Ready") === 0 ? "good" : e[4].indexOf("Running") === 0 ? "accent" : e[4].indexOf("Stopped") === 0 ? "bad" : e[4].indexOf("Matched") === 0 ? "warn" : "";
        return "<tr><td><div class='acct' style='font-weight:500'>" + esc(e[1]) + "</div><div class='meta'>" + e[0] + " · " + e[2] + " · " + e[3] + "</div></td><td>" + tag(st, e[4], true) + "</td><td class='nowrap'>" + ciBar(e) + "</td><td>" + esc(e[8]) + "</td></tr>";
      }).join("") + "</tbody>";
  }

  // ---------- DEALS ----------
  var pilots = [
    ["Summit Arbor Construction", "Strategic", "6", "7 of 22", "2.4", "1 of 8", "No", 38, "Ingestion delayed 3 days by ACC permissions. Escalate to the TAM today."],
    ["Marlow Pacific Builders", "Strategic", "9", "5 of 14", "3.1", "2 of 8", "No", 41, "Champion is on PTO. Book an exec-sponsor check-in with the VP of Ops."],
    ["Halvorsen Building Group", "Strategic", "4", "11 of 16", "6.2", "1 of 8", "Yes", 72, "Only TrunkText is in use. Demo TrunkSubmittal to the PEs this week."],
    ["Pierce & Lindqvist", "Mid-market", "14", "9 of 10", "7.8", "2 of 8", "Yes", 81, "Decision call Thursday. ROI one-pager is attached to the quote."],
    ["Corwin Barrett Construction", "Mid-market", "12", "18 of 20", "9.4", "3 of 8", "Yes", 88, "Send the success scorecard and propose expanding to 4 jobs."]
  ];
  function renderDeals() {
    $("pilots").innerHTML = "<thead><tr><th>Account</th><th class='r'>Health</th><th class='r'>Active users</th><th class='r'>Q / user / wk</th><th>Sponsor</th><th>Next step</th></tr></thead><tbody>" +
      pilots.map(function (p) {
        var cls = p[7] >= 75 ? "good" : p[7] >= 60 ? "warn" : "bad";
        var lbl = p[7] >= 75 ? "Healthy" : p[7] >= 60 ? "Watch" : "At risk";
        return "<tr><td><div class='acct'>" + esc(p[0]) + "</div><div class='meta'>" + p[1] + " · day " + p[2] + " of 14 · " + p[5] + " agents</div></td><td class='r nowrap'>" + tag(cls, p[7] + " · " + lbl, true) + "</td><td class='r num nowrap'>" + p[3] + "</td><td class='r num'>" + p[4] +
          "</td><td>" + (p[6] === "Yes" ? tag("good", "Yes") : tag("bad", "None")) + "</td><td>" + esc(p[8]) + "</td></tr>";
      }).join("") + "</tbody>";
    hbars($("q2c"), [
      { label: "Verbal → quote", v: 3.1, tip: "<b>3.1 days</b> median · was 6.0 before auto-quote" },
      { label: "Quote → redlines", v: 8.4, tip: "<b>8.4 days</b> median" },
      { label: "Security review", v: 11.2, tip: "<b>11.2 days</b> · biggest delay we control. Send the SOC 2 packet earlier" },
      { label: "Redlines → signature", v: 9.7, tip: "<b>9.7 days</b> median" },
      { label: "Signature → invoice", v: 1.2, tip: "<b>1.2 days</b> median" },
      { label: "Invoice → cash", v: 34, tip: "<b>34 days</b> · net-30 terms plus GC payment cycles", alt: true }
    ], { fmt: function (x) { return x + " d"; } });
    $("quote").innerHTML =
      '<table><tbody>' +
      '<tr><td class="meta">Account</td><td class="acct">Corwin Barrett Construction</td></tr>' +
      '<tr><td class="meta">Est. annual construction volume</td><td class="num">$1.1B · ENR list + project database</td></tr>' +
      '<tr><td class="meta">Tier</td><td>Core · unlimited users, every tool</td></tr>' +
      '<tr><td class="meta">Scope</td><td class="num">4 pilot jobs → 22 active projects</td></tr>' +
      '<tr><td class="meta">Annual price</td><td>Pulled from the volume-based price book <span class="meta">(connect finance)</span></td></tr>' +
      '<tr><td class="meta">ROI estimate</td><td class="num"><b>~4,300 hours a year</b> returned <span class="meta">· Cleveland benchmark: 790 hours ÷ 4 projects × 22 projects</span></td></tr>' +
      '<tr><td class="meta">Attachments</td><td>' + tag("accent", "ROI one-pager") + " " + tag("accent", "SOC 2 packet") + " " + tag("accent", "Cleveland case study") + "</td></tr>" +
      "</tbody></table>";
  }

  // ---------- WIN / LOSS ----------
  function renderWinLoss() {
    hbars($("loss"), [
      { label: "Using PMS AI", v: 27, tip: "<b>27%</b> · Procore or Autodesk AI was \"good enough\"" },
      { label: "No budget this cycle", v: 18, tip: "<b>18%</b> · usually mid-market, Q4 budgets" },
      { label: "Pilot stalled", v: 16, tip: "<b>16%</b> · champion left, or usage faded after week 1" },
      { label: "Building in-house", v: 12, tip: "<b>12%</b> · internal team using a general-purpose LLM" },
      { label: "Accuracy doubts", v: 11, tip: "<b>11%</b> · 57% of contractors cite AI accuracy (Dodge, 2025)" },
      { label: "Security review", v: 8, tip: "<b>8%</b> · 54% cite data security (Dodge, 2025)" },
      { label: "Too many tools", v: 8, tip: "<b>8%</b> · point-solution fatigue" }
    ], { fmt: function (x) { return x + "%"; } });
    hbars($("wins"), [
      { label: "Hours back in field", v: 34, tip: "<b>34%</b> · e.g. Haskell, up to 5 hours a day per user" },
      { label: "Junior staff leverage", v: 22, tip: "<b>22%</b> · e.g. Cleveland PEs and APMs" },
      { label: "Rework avoided", v: 19, tip: "<b>19%</b> · e.g. Gilbane, $100K+ a month" },
      { label: "Flat, unlimited pricing", v: 14, tip: "<b>14%</b> · vs. credit-based billing" },
      { label: "In-person training", v: 11, tip: "<b>11%</b> · jobsite enablement" }
    ], { fmt: function (x) { return x + "%"; } });
    var comp = [["Procore AI (Helix, agents)", "38%", 46], ["In-house / ChatGPT / Copilot", "21%", 58], ["Autodesk AI", "14%", 52], ["Nomic", "6%", 50], ["Document Crunch", "4%", 61]];
    $("comp").innerHTML = "<thead><tr><th>Competitor</th><th class='r'>In % of opps</th><th class='r'>Our win rate</th></tr></thead><tbody>" +
      comp.map(function (c) {
        return "<tr><td class='acct'>" + c[0] + "</td><td class='r num'>" + c[1] + "</td><td class='r'>" + tag(c[2] >= 50 ? "good" : "warn", c[2] + "%") + "</td></tr>";
      }).join("") + "</tbody>";
  }

  // ---------- AGENTS + STACK ----------
  function renderAgents() {
    var agents = [
      ["Account research", "A one-page brief before every meeting: active projects, tech stack, open roles, the best case study to use and who else to involve.", [["Briefs, 7 days", "214"], ["Rated useful", "91%"], ["Rep time saved", "~25 min each"]]],
      ["Personalization", "Drafts outbound openers grounded in a real project signal. Every draft is tagged with its test variant so results can be attributed.", [["Drafts, 7 days", "1,140"], ["Sent unedited", "62%"], ["Reply lift vs. template", "+3.4 pts"]]],
      ["Call intelligence", "Summarizes every call and pulls out objections, competitors, next steps and stakeholders, then writes them back to HubSpot.", [["Calls, 7 days", "63"], ["Competitor tags", "24"], ["CRM fields filled", "100%"]]],
      ["Pilot health", "Combines product usage with deal data, scores each pilot every day and recommends who to bring in next.", [["Pilots tracked", "18"], ["Flagged early", "5"], ["Saved after flag", "3"]]],
      ["Auto-quote + ROI", "Estimates construction volume, drafts the quote from the price book and attaches an ROI one-pager built on the closest case study.", [["Quotes drafted", "12"], ["Verbal → quote", "3.1 d"], ["Was", "6.0 d"]]],
      ["Win/loss + battlecards", "Runs a short interview after every closed deal, synthesizes the themes and updates the battlecards weekly.", [["Interviews", "9"], ["Battlecard updates", "4"], ["Top theme", "PMS AI"]]]
    ];
    $("agents").innerHTML = agents.map(function (a) {
      return '<div class="card agent-card"><div class="top"><span class="name">' + a[0] + "</span>" + tag("good", "Live", true) + "</div><p>" + esc(a[1]) + '</p><div class="stats">' +
        a[2].map(function (s) { return "<span><b>" + s[1] + "</b>" + s[0] + "</span>"; }).join("") + "</div></div>";
    }).join("");
    var stack = [
      ["System of record", "where truth lives", [["HubSpot", "live"], ["Google Workspace", "live"]]],
      ["Signals and data", "who to talk to and when", [["Clay", "rec"], ["Dodge / ConstructConnect", "rec"], ["ENR lists", "rec"], ["Job-post scraping", "rec"], ["Website visitor ID", "rec"]]],
      ["Orchestration", "moves data between tools", [["n8n", "rec"], ["Python jobs", "rec"], ["Zapier (existing glue)", "rec"]]],
      ["AI layer", "the agents", [["Claude", "live"], ["ChatGPT", "live"], ["MCP servers: HubSpot, calls, docs", "rec"]]],
      ["Conversations", "what buyers actually say", [["Call recorder", "rec"], ["Microsoft Teams", "live"]]],
      ["Warehouse and BI", "with the data-engineering hire", [["BigQuery or Snowflake + dbt", "plan"], ["Hex", "plan"]]],
      ["Quote-to-cash", "from verbal yes to cash", [["HubSpot Quotes", "rec"], ["E-signature", "rec"], ["Billing sync", "plan"]]]
    ];
    $("stack").innerHTML = stack.map(function (l) {
      return '<div class="layer"><div class="ln">' + l[0] + "<span>" + l[1] + '</span></div><div class="chips">' +
        l[2].map(function (c) { return '<span class="chip"><span class="s ' + c[1] + '"></span>' + esc(c[0]) + "</span>"; }).join("") + "</div></div>";
    }).join("");
  }

  // ---------- ROADMAP ----------
  function renderRoadmap() {
    var phases = [
      ["Week 1", "Listen and map", ["Shadow two BDRs, two AEs, marketing and a CSM. Join a pilot kickoff.", "Audit HubSpot: lifecycle stages, source fields, duplicates, manual workflows.", "Get access to call recordings and product usage data."], "Every manual GTM workflow listed and ranked by hours lost."],
      ["Week 2", "First visible win", ["Event-to-pipeline: fall-conference scans enriched, scored and routed within 24 hours.", "Draft follow-ups that name each account's live projects.", "Account research briefs on every meeting's HubSpot record."], "Event leads worked within a day, and AEs opening the briefs."],
      ["Week 3", "Trustworthy attribution", ["Required self-reported source on every demo form.", "UTM rules and campaign tags for events.", "The Today view running on real data."], "Every new opportunity has a source the team trusts."],
      ["Week 4", "Start the testing loop", ["Project-start sequence live for one segment, with its first A/B test registered.", "Signal scoring v0 for the ENR 400 and mid-market.", "Publish the GTM OS roadmap, ranked by pipeline impact."], "First test running, and a roadmap approved by sales and marketing leads."]
    ];
    $("phases").innerHTML = phases.map(function (p) {
      return '<div class="card phase"><div class="when">' + p[0] + "</div><h3>" + p[1] + "</h3><ul>" + p[2].map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") +
        '</ul><div class="done-when"><b>Done when:</b> ' + esc(p[3]) + "</div></div>";
    }).join("");
    var qs = [
      ["Pipeline by source today, and how much is it trusted?", "Decides whether the first month goes to attribution or to building."],
      ["Top three loss reasons last quarter, and the win rate when Procore AI comes up", "Shapes the battlecards and which agents to build first."],
      ["Pilot-to-contract rate, and where pilots stall", "Tells me how much the pilot health score matters."],
      ["The full stack beyond HubSpot: calls, sequencing, enrichment, CPQ, billing", "Build on what's there before buying anything."],
      ["Can GTM use product usage data from TrunkText and the agents?", "This powers pilot health and expansion signals."],
      ["How should mid-market and the long tail differ from enterprise?", "That's where automation gives the most leverage."]
    ];
    $("questions").innerHTML = qs.map(function (q) {
      return '<li><button class="check" type="button" aria-label="Mark answered"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></button><div><div class="a-title">' + esc(q[0]) + '</div><div class="a-why">' + esc(q[1]) + "</div></div></li>";
    }).join("");
    $("questions").querySelectorAll(".check").forEach(function (c) { c.addEventListener("click", function () { c.parentNode.classList.toggle("done"); }); });
  }

  // ---------- NAV ----------
  function wireNav() {
    var btns = document.querySelectorAll(".nav-btn");
    btns.forEach(function (b) {
      b.addEventListener("click", function () { go(b.getAttribute("data-view")); });
    });
    function go(id) {
      btns.forEach(function (x) { x.setAttribute("aria-current", x.getAttribute("data-view") === id ? "page" : "false"); });
      document.querySelectorAll(".view").forEach(function (v) { v.classList.toggle("active", v.id === "view-" + id); });
      var v = $("view-" + id);
      $("view-title").textContent = v.getAttribute("data-title");
      $("crumb").textContent = v.getAttribute("data-crumb");
      $("main").scrollTop = 0; window.scrollTo(0, 0);
      try { history.replaceState(null, "", "#" + id); } catch (e) {}
    }
    var h = (location.hash || "").slice(1);
    if (h && $("view-" + h)) go(h);

    segWire("seg-funnel", "data-seg", renderFunnel);
    segWire("seg-signals", "data-f", renderSignals);
    segWire("seg-persona", "data-p", renderSequence);

    $("agent-open").addEventListener("click", function () { body.classList.add("agent-open"); });
    $("agent-close").addEventListener("click", function () { body.classList.remove("agent-open"); });
  }
  function segWire(id, attr, fn) {
    var el = $(id);
    el.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        el.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
        fn(b.getAttribute(attr));
      });
    });
  }

  // ---------- AGENT PANE ----------
  var answers = [
    { q: "Why is CJ the right person for this role?", a:
      "### The short version\n" +
      "I've been the rep this system is built for, and I build things myself.\n" +
      "### Enterprise selling\n" +
      "- At Bebop Sensors I closed **Tesla, BMW and Toyota**: long cycles, many stakeholders, pilots that had to turn into contracts. **124% of quota, $2.5M+ closed.**\n" +
      "- Before that: Zenefits, TubeMogul, and Head of Partnerships at Tokemak. About ten years carrying a number.\n" +
      "### Building with AI\n" +
      "- I've shipped three apps (OMG Career, OMG Goals and Hey Sammy) by building with frontier models every day. I'm self-taught, and I pick up new tools fast.\n" +
      "- This dashboard is the same habit: scoped, designed and shipped before the first interview.\n" +
      "### Why the combination matters\n" +
      "- GTM tooling usually fails on adoption, not engineering. Reps ignore anything that doesn't help on their next call. I know what an AE will actually open between jobsite visits.\n" +
      "- Trunk sells the same idea to superintendents: meet people where they already work. I'd hold internal tools to that standard.\n" +
      "### Logistics\n" +
      "- Based in New York and ready for hybrid work at HQ." },
    { q: "What design decisions went into this?", a:
      "### What this shows\n" +
      "- **What needs doing today, not totals.** The first screen is an action queue ranked by revenue at stake. Totals are one click away.\n" +
      "- **Every metric has an owner and a next step.** If nobody acts on a number, it doesn't belong on the dashboard.\n" +
      "- **HubSpot stays the source of truth.** Agents read from it and write back to it, so reps don't learn a new tool and leaders don't reconcile two systems.\n" +
      "### How it improves\n" +
      "- **Testing is built in.** Every sequence step carries its variant ID, and every test is registered before launch.\n" +
      "- **Honest statistics.** Deal stages are too small for real A/B tests, so they use matched cohorts and are labeled that way.\n" +
      "### How it feels\n" +
      "- **Copy written for the field.** The emails are short, plain and readable on a phone in a truck, the way Trunk talks to builders.\n" +
      "- **Calm visuals.** One accent color, with red and amber only next to a label. The palette comes from my personal site, so it reads as my work, not a copy of Trunk's brand.\n" +
      "- **Clear about what's mocked.** The customers, case-study results and competitors are real. The pipeline and test numbers are samples, and one label says so." },
    { q: "What would CJ ship in the first 30 days?", a:
      "### Week 1: Listen and map\n" +
      "- Shadow two BDRs, two AEs, marketing and a CSM. Join a pilot kickoff.\n" +
      "- Audit HubSpot: lifecycle stages, source fields, duplicates and which workflows are still manual.\n" +
      "- Get access to call recordings and product usage data.\n" +
      "### Week 2: First visible win\n" +
      "- **Event-to-pipeline:** every fall-conference badge scan enriched, scored and routed within 24 hours, with a draft follow-up that names the account's live projects.\n" +
      "- **Account research briefs** on every meeting's HubSpot record.\n" +
      "### Week 3: Make attribution trustworthy\n" +
      "- A required self-reported source on every demo form, plus UTM rules and campaign tags for events.\n" +
      "- The Today view running on real data.\n" +
      "### Week 4: Start the testing loop\n" +
      "- The project-start sequence live for one segment, with its first A/B test registered.\n" +
      "- Signal scoring v0 for the ENR 400 and the mid-market list.\n" +
      "- A GTM OS roadmap ranked by pipeline impact, reviewed with the sales and marketing leads.\n" +
      "### What I'd need\n" +
      "- HubSpot admin access, budget for Clay and one construction-data source, and 30 minutes a week with the VP of Sales." }
  ];

  function md(src) {
    var lines = src.split("\n"), out = [], inList = false;
    function inline(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*\*(.*)$/, "<b>$1</b>"); }
    lines.forEach(function (l) {
      if (l.indexOf("- ") === 0) { if (!inList) { out.push("<ul>"); inList = true; } out.push("<li>" + inline(l.slice(2)) + "</li>"); return; }
      if (inList) { out.push("</ul>"); inList = false; }
      if (l.indexOf("### ") === 0) out.push("<h4>" + inline(l.slice(4)) + "</h4>");
      else if (l.trim()) out.push("<p>" + inline(l) + "</p>");
    });
    if (inList) out.push("</ul>");
    return out.join("");
  }

  var busy = false;
  function renderPrompts() {
    $("prompts").innerHTML = answers.map(function (a, i) {
      return '<button class="prompt" type="button" data-i="' + i + '">' + esc(a.q) + '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>';
    }).join("") + '<div class="prompt-note">Answers are pre-written. In the real build, this pane is a live agent.</div>';
    $("prompts").querySelectorAll(".prompt").forEach(function (b) {
      b.addEventListener("click", function () { ask(+b.getAttribute("data-i")); });
    });
  }
  function setBusy(v) {
    busy = v;
    $("prompts").querySelectorAll(".prompt").forEach(function (b) { b.disabled = v; });
    document.querySelector(".agent-status").textContent = v ? "Thinking…" : "Ready";
  }
  function ask(i) {
    if (busy) return;
    var thread = $("thread"), A = answers[i];
    var w = thread.querySelector(".welcome"); if (w) w.remove();
    var u = document.createElement("div"); u.className = "msg user"; u.textContent = A.q; thread.appendChild(u);
    var b = document.createElement("div"); b.className = "msg bot";
    b.innerHTML = '<span class="thinking"><i></i><i></i><i></i></span>';
    thread.appendChild(b);
    thread.scrollTop = thread.scrollHeight;
    setBusy(true);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(function () {
      if (reduce) { b.innerHTML = md(A.a); setBusy(false); return; }
      var n = 0, text = A.a;
      (function tick() {
        n = Math.min(text.length, n + 3 + Math.floor(Math.random() * 3));
        b.innerHTML = md(text.slice(0, n)) + (n < text.length ? '<span class="caret"></span>' : "");
        var near = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 80;
        if (near) thread.scrollTop = thread.scrollHeight;
        if (n < text.length) setTimeout(tick, 14); else setBusy(false);
      })();
    }, 650);
  }
})();

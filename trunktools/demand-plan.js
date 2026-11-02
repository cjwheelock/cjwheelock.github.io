(function () {
  "use strict";
  var plan = document.getElementById("view-demand-plan");
  if (!plan) return;
  plan.querySelectorAll("[data-plan-jump]").forEach(function (button) {
    button.addEventListener("click", function () {
      var section = document.getElementById(button.getAttribute("data-plan-jump"));
      if (!section) return;
      section.scrollIntoView({ behavior: "auto", block: "start" });
      var heading = section.querySelector("h3");
      if (heading) heading.focus({ preventScroll: true });
    });
  });
})();

"use strict";

(() => {
  const screens = [...document.querySelectorAll(".question-screen")];
  const application = document.querySelector("#application");
  const back = document.querySelector("#back-button");
  const count = document.querySelector("#step-count");
  const progress = document.querySelector("#step-progress");
  const result = document.querySelector("#result");
  const ageExit = document.querySelector("#age-exit");
  const age = document.querySelector("#age");
  const kids = document.querySelector("#kids");
  const qualifications = document.querySelector("#qualifications");
  const table = document.querySelector("#table");
  let currentStep = 0;
  let selectedLevel = null;
  let view = "questions";

  // Answers stay in these existing form elements and memory. No sending or storage.
  function showStep(index, moveFocus = true) {
    currentStep = index;
    view = "questions";
    screens[index].hidden = false;
    screens.forEach((screen, i) => { if (i !== index) screen.hidden = true; });
    result.hidden = true;
    ageExit.hidden = true;
    back.disabled = index === 0;
    count.textContent = `Step ${index + 1} of 4`;
    progress.value = index + 1;
    progress.textContent = `${index + 1} of 4`;
    if (moveFocus) {
      screens[index].querySelector(".question-title").focus({ preventScroll: true });
      application.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }

  function clearInvalid(control, errorId) {
    control.removeAttribute("aria-invalid");
    const ids = (control.getAttribute("aria-describedby") || "").split(" ").filter((id) => id && id !== errorId);
    if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
    else control.removeAttribute("aria-describedby");
  }

  function showError(control, errorId) {
    document.getElementById(errorId).hidden = false;
    control.setAttribute("aria-invalid", "true");
    const ids = (control.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
    if (!ids.includes(errorId)) ids.push(errorId);
    control.setAttribute("aria-describedby", ids.join(" "));
    control.focus();
  }

  function reset(moveFocus = true) {
    document.querySelectorAll("form").forEach((form) => form.reset());
    document.querySelectorAll(".error").forEach((error) => { error.hidden = true; });
    document.querySelectorAll("[aria-invalid]").forEach((control) => {
      for (const errorId of ["qualifications-error", "table-error", "details-error"]) clearInvalid(control, errorId);
    });
    selectedLevel = null;
    document.querySelectorAll("[data-unhinged]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    showStep(0, moveFocus);
  }

  document.querySelectorAll("[data-unhinged]").forEach((button) => {
    button.addEventListener("click", () => {
      if (view !== "questions" || currentStep !== 0) return;
      selectedLevel = button.dataset.unhinged;
      document.querySelectorAll("[data-unhinged]").forEach((choice) => choice.setAttribute("aria-pressed", String(choice === button)));
      showStep(1);
    });
  });

  for (const [control, nextStep] of [[qualifications, 2], [table, 3]]) {
    const errorId = `${control.id}-error`;
    document.getElementById(`${control.id}-form`).addEventListener("submit", (event) => {
      event.preventDefault();
      if (!control.value.trim()) return showError(control, errorId);
      showStep(nextStep);
    });
    control.addEventListener("input", () => {
      clearInvalid(control, errorId);
      document.getElementById(errorId).hidden = true;
    });
  }

  document.querySelector("#details-form").addEventListener("change", () => {
    document.querySelector("#details-error").hidden = true;
    document.querySelectorAll("#details-form select, #details-form input").forEach((control) => clearInvalid(control, "details-error"));
  });
  document.querySelector("#details-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (age.value === "under18") {
      reset(false);
      ageExit.hidden = false;
      screens.forEach((screen) => { screen.hidden = true; });
      view = "exit";
      back.disabled = true;
      count.textContent = "18+ only";
      progress.value = 0;
      progress.textContent = "0 of 4";
      document.querySelector("#age-exit-title").focus({ preventScroll: true });
      application.scrollIntoView({ block: "start", behavior: "auto" });
      return;
    }
    if (!selectedLevel) return showStep(0);
    if (!qualifications.value.trim()) {
      showStep(1);
      return showError(qualifications, "qualifications-error");
    }
    if (!table.value.trim()) {
      showStep(2);
      return showError(table, "table-error");
    }
    const years = Number(age.value);
    if (!age.value || !Number.isInteger(years) || years < 18 || years > 120) return showError(age, "details-error");
    if (!kids.value) return showError(kids, "details-error");
    if (!document.querySelector('input[name="hypothetical"]:checked')) return showError(document.querySelector('input[name="hypothetical"]'), "details-error");
    // Every complete adult combination reaches the same joke result. No scoring.
    result.hidden = false;
    screens.forEach((screen) => { screen.hidden = true; });
    view = "result";
    back.disabled = false;
    count.textContent = "Complete";
    document.querySelector("#result-title").focus({ preventScroll: true });
    application.scrollIntoView({ block: "start", behavior: "auto" });
  });

  back.addEventListener("click", () => {
    if (view === "result") showStep(3);
    else if (view === "questions" && currentStep > 0) showStep(currentStep - 1);
  });
  document.querySelectorAll(".restart-button").forEach((button) => button.addEventListener("click", () => reset()));
  // A click focuses the textarea; the phone keyboard provides its own dictation.
  document.querySelectorAll("[data-dictation-target]").forEach((button) => {
    button.addEventListener("click", () => document.getElementById(button.dataset.dictationTarget).focus());
  });

  reset(false);
  window.addEventListener("pageshow", (event) => { if (event.persisted) reset(false); });
})();

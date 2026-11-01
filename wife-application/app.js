"use strict";

(() => {
  const screens = [...document.querySelectorAll(".question-screen")];
  const application = document.querySelector("#application");
  const intro = document.querySelector(".intro");
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
  let sending = false;
  let attempt = null;
  let preparedSelfie = null;
  const selfieLevels = { 1: "only slightly unhinged", 2: "somewhat unhinged", 3: "moderately unhinged", 4: "mostly unhinged", 5: "very unhinged" };
  function resetContactView() {
    document.querySelector("#committee-contact").hidden = false;
    document.querySelector("#skipped-result").hidden = true;
    document.querySelector("#submitted-result").hidden = true;
    result.setAttribute("aria-labelledby", "result-title");
  }
  document.querySelector("#skip-contact").addEventListener("click", () => {
    document.querySelector("#committee-contact").hidden = true;
    document.querySelector("#skipped-result").hidden = false;
    result.setAttribute("aria-labelledby", "skipped-result-title");
    document.querySelector("#skipped-result-title").focus({ preventScroll: true });
  });

  function syncWritingViewport() {
    if (!application.classList.contains("is-writing")) return;
    const viewport = window.visualViewport;
    const height = Math.max(1, Math.floor(viewport ? viewport.height : window.innerHeight));
    const top = Math.max(0, viewport ? viewport.offsetTop : 0);
    application.style.setProperty("--writing-viewport-height", `${height}px`);
    application.style.setProperty("--writing-viewport-top", `${top}px`);
  }

  function setWritingMode(enabled) {
    application.classList.toggle("is-writing", enabled);
    document.body.classList.toggle("is-writing", enabled);
    if (enabled) syncWritingViewport();
  }

  window.addEventListener("resize", syncWritingViewport);
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncWritingViewport);
    window.visualViewport.addEventListener("scroll", syncWritingViewport);
  }

  // Answers remain in memory until a deliberate, consented submission.
  function showStep(index, moveFocus = true) {
    currentStep = index;
    view = "questions";
    intro.hidden = index !== 0;
    setWritingMode(index === 1 || index === 2);
    screens[index].hidden = false;
    screens.forEach((screen, i) => { if (i !== index) screen.hidden = true; });
    result.hidden = true;
    ageExit.hidden = true;
    back.disabled = index === 0;
    count.textContent = `Step ${index + 1} of 4`;
    progress.value = index + 1;
    progress.textContent = `${index + 1} of 4`;
    if (moveFocus) {
      const focusTarget = screens[index].querySelector("textarea") || screens[index].querySelector(".question-title");
      // Runs synchronously inside the navigation gesture so mobile can show its keyboard.
      focusTarget.focus({ preventScroll: true });
      if (index === 0) window.scrollTo({ top: 0, behavior: "auto" });
      else if (!application.classList.contains("is-writing")) application.scrollIntoView({ block: "start", behavior: "auto" });
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
    attempt = null; preparedSelfie = null;
    document.querySelector("#capture-status").textContent = "";
    resetContactView();
    document.querySelectorAll("[data-unhinged]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    showStep(0, moveFocus);
  }

  function showAgeExit() {
    setWritingMode(false);
    ageExit.hidden = false;
    result.hidden = true;
    intro.hidden = true;
    screens.forEach((screen) => { screen.hidden = true; });
    view = "exit";
    back.disabled = false;
    count.textContent = "18+ only";
    progress.value = 0;
    progress.textContent = "0 of 4";
    document.querySelector("#age-exit-title").focus({ preventScroll: true });
    application.scrollIntoView({ block: "start", behavior: "auto" });
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
    if (age.value === "under18") showAgeExit();
  });
  document.querySelector("#details-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (age.value === "under18") {
      showAgeExit();
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
    // Adult validation precedes the optional contact/selfie screen.
    resetContactView();
    document.querySelectorAll("[data-selfie-level]").forEach((label) => { label.textContent = selfieLevels[selectedLevel]; });
    result.hidden = false;
    screens.forEach((screen) => { screen.hidden = true; });
    view = "result";
    back.disabled = false;
    count.textContent = "Complete";
    document.querySelector("#result-title").focus({ preventScroll: true });
    application.scrollIntoView({ block: "start", behavior: "auto" });
  });

  back.addEventListener("click", () => {
    if (sending || view === "submitted") return;
    if (view === "exit") return returnFromAgeExit();
    if (view === "result") showStep(3);
    else if (view === "questions" && currentStep > 0) showStep(currentStep - 1);
  });
  function returnFromAgeExit() {
    age.value = "";
    showStep(3);
    age.focus({ preventScroll: true });
  }
  document.querySelector("#exit-back-button").addEventListener("click", returnFromAgeExit);
  document.querySelectorAll(".restart-button").forEach((button) => button.addEventListener("click", () => reset()));

  const contactForm = document.querySelector("#contact-form");
  const contactFields = document.querySelector("#contact-fields");
  const captureStatus = document.querySelector("#capture-status");
  const selfieInput = document.querySelector("#applicant-selfie");
  const submitButton = document.querySelector("#submit-application");
  const skipButton = document.querySelector("#skip-contact");
  selfieInput.addEventListener("change", () => { preparedSelfie = null; attempt = null; captureStatus.textContent = ""; });

  async function prepareSelfie(file) {
    if (!file) return null;
    if (preparedSelfie && preparedSelfie.original === file) return preparedSelfie.blob;
    if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("selfie");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error("selfie")); image.src = url; });
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 50_000_000) throw new Error("selfie");
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.78));
      if (!blob || blob.size > 5 * 1024 * 1024) throw new Error("selfie");
      preparedSelfie = { original: file, blob }; return blob;
    } finally { URL.revokeObjectURL(url); }
  }

  contactForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (sending || view !== "result") return;
    const years = Number(age.value);
    if (!age.value || !Number.isInteger(years) || years < 18 || years > 120) { showAgeExit(); return; }
    if (!document.querySelector("#contact-consent").checked) { captureStatus.textContent = "Confirm that CJ may review your application before submitting."; document.querySelector("#contact-consent").focus(); return; }
    const phone = document.querySelector("#applicant-phone").value.trim();
    if (phone && (!/^[+\d().\s-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 20)) { captureStatus.textContent = "Enter a valid phone number or leave it blank."; document.querySelector("#applicant-phone").focus(); return; }
    sending = true; contactFields.disabled = true; skipButton.disabled = true; back.disabled = true;
    contactForm.setAttribute("aria-busy", "true"); submitButton.textContent = "Submitting…"; captureStatus.textContent = "Submitting your application…";
    let timeout;
    try {
      const file = selfieInput.files[0] || null;
      const photo = await prepareSelfie(file);
      const values = { age: years, kids: kids.value, unhinged: Number(selectedLevel), qualifications: qualifications.value.trim(), table: table.value.trim(), hypothetical: document.querySelector('input[name="hypothetical"]:checked').value, name: document.querySelector("#applicant-name").value.trim(), phone, consent: true };
      const fingerprint = JSON.stringify(values) + (file ? `${file.name}:${file.size}:${file.lastModified}` : "");
      if (!attempt || attempt.fingerprint !== fingerprint) attempt = { fingerprint, id: crypto.randomUUID() };
      const body = new FormData(); body.append("application", JSON.stringify({ ...values, id: attempt.id }));
      if (photo) body.append("selfie", photo, "selfie.jpg");
      const controller = new AbortController(); timeout = setTimeout(() => controller.abort(), 25000);
      const response = await fetch("https://ofcgfocrhhjoinxfvklq.supabase.co/functions/v1/wife-application", { method: "POST", headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mY2dmb2NyaGhqb2lueGZ2a2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5Nzc0MzksImV4cCI6MjA2MTU1MzQzOX0.TCimevgvbltuWcl6_XIKZiQn06C02S1gYhht8ue3b28", apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mY2dmb2NyaGhqb2lueGZ2a2xxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5Nzc0MzksImV4cCI6MjA2MTU1MzQzOX0.TCimevgvbltuWcl6_XIKZiQn06C02S1gYhht8ue3b28" }, body, signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
      const receipt = await response.json();
      if (!response.ok || receipt.submitted !== true || receipt.id !== attempt.id) throw new Error(receipt.error || "unavailable");
      document.querySelector("#submitted-result").hidden = false;
      document.querySelector("#committee-contact").hidden = true;
      document.querySelector("#skipped-result").hidden = true;
      result.setAttribute("aria-labelledby", "submitted-title");
      view = "submitted"; document.querySelector("#submitted-title").focus({ preventScroll: true });
      application.scrollIntoView({ block: "start", behavior: "auto" });
    } catch (error) {
      if (error.message === "selfie") captureStatus.textContent = "Choose a JPEG, PNG or WebP selfie up to 5 MB, or remove the photo and retry.";
      else if (error.message === "limited") captureStatus.textContent = "Submission limit reached. Please try again later.";
      else if (error.message === "busy") captureStatus.textContent = "Your previous attempt is still saving. Wait a moment, then retry.";
      else captureStatus.textContent = "Submission couldn’t be confirmed. Your answers are still here. Please retry.";
    } finally {
      clearTimeout(timeout); sending = false; contactFields.disabled = false; skipButton.disabled = false;
      back.disabled = view === "submitted"; contactForm.removeAttribute("aria-busy"); submitButton.textContent = "Submit application";
    }
  });

  reset(false);
  window.addEventListener("pageshow", (event) => { if (event.persisted) reset(false); });
})();

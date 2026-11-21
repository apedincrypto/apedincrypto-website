const form = document.querySelector("#waitlist-form");
const message = document.querySelector("#form-message");
const button = form.querySelector("button[type='submit']");
document.querySelector("#year").textContent = new Date().getFullYear();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "";
  message.classList.remove("error");

  if (!form.reportValidity()) return;
  if (!document.querySelector("#consent").checked) return;

  const siteKey = window.SITE_CONFIG?.turnstileSiteKey;
  if (!siteKey || siteKey.includes("REPLACE_")) {
    message.textContent = "The waitlist is being configured. Please check back shortly.";
    message.classList.add("error");
    return;
  }

  const token = window.turnstile?.getResponse?.();
  if (!token) {
    message.textContent = "Please complete the security check.";
    message.classList.add("error");
    return;
  }

  button.disabled = true;
  button.textContent = "Submitting…";
  try {
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.querySelector("#email").value.trim(),
        consent: document.querySelector("#consent").checked,
        turnstileToken: token,
        company_website: form.querySelector("[name='company_website']").value
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || "Unable to submit right now.");
    form.reset();
    if (window.turnstile) window.turnstile.reset();
    message.textContent = "Check your inbox for the confirmation email.";
  } catch (error) {
    message.textContent = error.message || "Something went wrong. Please try again.";
    message.classList.add("error");
    if (window.turnstile) window.turnstile.reset();
  } finally {
    button.disabled = false;
    button.innerHTML = 'Join the waitlist <span aria-hidden="true">→</span>';
  }
});

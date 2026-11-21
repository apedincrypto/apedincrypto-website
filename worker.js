export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/waitlist" || request.method !== "POST") {
      return new Response("Not found", { status: 404 });
    }
    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://apedincrypto.com";
    if (origin && origin !== allowedOrigin) return json({ message: "Forbidden" }, 403);

    let body;
    try { body = await request.json(); } catch { return json({ message: "Invalid request." }, 400); }

    const email = String(body.email || "").trim().toLowerCase();
    if (body.company_website) return json({ ok: true });
    if (!body.consent) return json({ message: "Consent is required." }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ message: "Enter a valid email address." }, 400);
    }
    if (!body.turnstileToken || !env.TURNSTILE_SECRET_KEY) {
      return json({ message: "Security check is not configured." }, 503);
    }
    if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID || !env.BREVO_DOI_TEMPLATE_ID) {
      return json({ message: "Waitlist service is not configured yet." }, 503);
    }

    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: body.turnstileToken,
        remoteip: request.headers.get("CF-Connecting-IP") || ""
      })
    });
    const verification = await verify.json();
    if (!verification.success) return json({ message: "Security check failed. Please try again." }, 400);

    const apiResponse = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": env.BREVO_API_KEY
      },
      body: JSON.stringify({
        email,
        includeListIds: [Number(env.BREVO_LIST_ID)],
        templateId: Number(env.BREVO_DOI_TEMPLATE_ID),
        redirectionUrl: env.DOI_REDIRECT_URL || "https://apedincrypto.com/confirmed.html"
      })
    });
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      // Avoid leaking provider details to the browser; retain detail in Worker logs.
      console.error("Brevo DOI request failed", apiResponse.status, errorText);
      if (apiResponse.status === 400) return json({ message: "This address may already be registered. Check your inbox or try another address." }, 400);
      return json({ message: "We couldn't process the signup. Please try again later." }, 502);
    }
    return json({ ok: true });
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "https://apedincrypto.com"
    }
  });
}

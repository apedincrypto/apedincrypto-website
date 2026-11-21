# CANDY³ waitlist website

A static, responsive CANDY³ landing page for `apedincrypto.com`, using the supplied brand assets. It contains a hero/waitlist section, an About section, social links, a privacy draft, and a Cloudflare Worker integration skeleton for Brevo double opt-in.

## Current status

- Frontend and supplied artwork: included.
- Signup form UI: included.
- Brevo and Turnstile integration: **not live until configured**.
- Privacy notice: draft only; complete and review before launch.
- No real email addresses are collected by this starter package.

## Files

- `index.html`, `styles.css`, `main.js`: website.
- `assets/`: copies of the supplied brand images.
- `worker.js`: Cloudflare Worker endpoint that verifies Turnstile and calls Brevo DOI.
- `wrangler.toml`: Worker configuration template.
- `privacy.html`: privacy notice draft.
- `confirmed.html`: post-confirmation page.

## Deployment outline

### 1. Cloudflare Pages

1. Create a GitHub repository and upload this folder.
2. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
3. Select the repository.
4. Use the repository root as the project root. No build command is required; use the root directory as the output directory if the dashboard requires a build output setting.
5. Deploy to a temporary `*.pages.dev` address and test the static pages.

### 2. Namecheap → Cloudflare DNS

1. Add `apedincrypto.com` to Cloudflare.
2. Review the DNS records Cloudflare imports. Before changing nameservers, preserve any existing MX, TXT, CNAME and other records you still need.
3. Cloudflare assigns two nameservers. Copy the exact values from your Cloudflare dashboard.
4. In Namecheap: **Domain List → Manage → Nameservers → Custom DNS**. Enter the two Cloudflare nameservers and save.
5. Wait until Cloudflare shows the zone as Active.
6. In Cloudflare Pages → your project → Custom domains, add `apedincrypto.com` and follow its validation steps.

Do not delete existing email DNS records. A nameserver change moves DNS authority to Cloudflare; records do not automatically copy back into Namecheap's DNS after the switch. If the domain already has email configured, verify that its MX and TXT records are present in Cloudflare before changing nameservers.

### 3. Turnstile

1. Create a Cloudflare Turnstile widget for `apedincrypto.com`.
2. Add the hostname and select Managed mode.
3. Replace `REPLACE_WITH_TURNSTILE_SITE_KEY` in both `window.SITE_CONFIG.turnstileSiteKey` and the `data-sitekey` attribute in `index.html` with the **site key**.
4. Add the **secret key** to the Worker as `TURNSTILE_SECRET_KEY`.

For a production-ready implementation, load the Turnstile client script and render the widget in the `#turnstile-slot` element. The current HTML/JS is a frontend scaffold and needs that widget markup/script added before the signup endpoint can pass verification.

### 4. Brevo

1. Create a Brevo account.
2. Create a contact list named `CANDY³ — Project Waitlist`; note its numeric list ID.
3. Create a double-opt-in confirmation email template; note its numeric template ID.
4. Configure sender identity/domain authentication for `apedincrypto.com`. Add the exact DNS records Brevo gives you in Cloudflare.
5. Generate a Brevo API key.
6. Deploy the Worker and set secrets:
   - `BREVO_API_KEY`
   - `TURNSTILE_SECRET_KEY`
7. Set Worker variables:
   - `BREVO_LIST_ID`
   - `BREVO_DOI_TEMPLATE_ID`
   - `DOI_REDIRECT_URL=https://apedincrypto.com/confirmed.html`
   - `ALLOWED_ORIGIN=https://apedincrypto.com`

Use Cloudflare Worker routes to attach `apedincrypto.com/api/*` to this Worker. Test signup with your own address before launch.

### 5. Turnstile widget

The Turnstile script and widget container are already included in `index.html`. Replace the placeholder site key in both locations as described above. The JavaScript uses `turnstile.getResponse()` after the widget is completed.

### 6. Business mailbox

The requested project address is `get@apedincrypto.com`. Choose a mailbox provider first (for example Purelymail, Migadu or Zoho Mail), then configure its MX records and SPF/DKIM/DMARC records in Cloudflare. Use this address publicly only after the mailbox is operational.

Do not create multiple SPF TXT records. Merge authorised senders into a single SPF policy as instructed by the mailbox provider and Brevo.

## Pre-launch checklist

- [ ] Complete and review the privacy notice, including legal operator, jurisdiction, retention and contact details.
- [ ] Add actual Turnstile site key and widget.
- [ ] Configure Brevo list and DOI template.
- [ ] Add Worker secrets and variables.
- [ ] Attach Worker route `apedincrypto.com/api/*`.
- [ ] Authenticate sending domain in Brevo.
- [ ] Set up `get@apedincrypto.com`.
- [ ] Verify all MX/TXT records after the Namecheap nameserver change.
- [ ] Test successful signup, confirmation email, confirmed redirect, duplicate signup and unsubscribe.
- [ ] Test mobile, desktop and keyboard accessibility.

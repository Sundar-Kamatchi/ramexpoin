# ramexpo.in — Domain & DNS Ownership

## Where things live

- **Domain registration + DNS zone**: owned by the **"S R venkatesw..." Vercel account** (team slug `s-r-venkateswarans-projects`). Registrar is Vercel itself ($14/yr, auto-renews Aug 1).
  - DNS records editor: `vercel.com/s-r-venkateswarans-projects/~/domains/ramexpo.in`
- **Production deployment**: the `ramexpoin` project, under the **"Sundar's projects" Vercel account** (team slug `sundars-projects-4b4742a2`).
  - Project domain settings: `vercel.com/sundars-projects-4b4742a2/ramexpoin/settings/domains`

Because the DNS zone and the deploying project are on **different Vercel accounts**, Vercel treats the domain as "linked to another account" and requires ownership verification via a `_vercel` TXT record.

## Current state (as of 2026-08-07)

- `ramexpo.in` (apex) → 308 redirect → `www.ramexpo.in` — Valid Configuration
- `www.ramexpo.in` → Production — Valid Configuration
- Both resolve correctly to the `ramexpoin` app.

## If verification breaks again (e.g. new subdomain, domain re-added)

1. On the `ramexpoin` project's Domains page, find the domain/subdomain showing "Verification Required" and expand **"View DNS configuration"**. Copy the exact TXT value shown, e.g.:
   ```
   Name: _vercel
   Value: vc-domain-verify=<domain>,<hash>
   ```
2. Go to `vercel.com/s-r-venkateswarans-projects/~/domains/ramexpo.in`, scroll to **DNS Records**, click **Add**.
3. **Important**: explicitly set the record **Type to `TXT`** — the form defaults to `A` and will error with `Invalid request: 'value' should match format "ipv4"` if left unset.
4. Name: `_vercel`, Value: the exact string copied in step 1. Multiple TXT records can coexist at the same `_vercel` name (apex and `www` each have their own).
5. Save, then go back to the `ramexpoin` project's Domains page and click **Refresh**. Verification typically completes within 1-2 minutes since it's Vercel's own DNS.

## Cleanup (optional, not urgent)

There's a stale apex-verification TXT record (`vc-domain-verify=ramexpo.in,145a648fa...`) left in the DNS zone from an earlier verification. It's inert now but can be deleted for tidiness.

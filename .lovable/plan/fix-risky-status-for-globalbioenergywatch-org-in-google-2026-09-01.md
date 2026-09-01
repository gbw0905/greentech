# Fix "risky" status for globalbioenergywatch.org in Google

## What's going on

- The site itself is healthy: valid HTTPS certificate, normal response, backend security scan shows no critical issues.
- The connected Google account currently has **zero verified Search Console properties** — the earlier verification for globalbioenergywatch.org is no longer present, so Google has no ownership record for the domain and we cannot see the exact Security Issues report behind the "risky" label.
- Until the domain is re-verified, Google (Safe Browsing / Search Console) cannot be inspected or appealed for this site. New, recently registered domains are also commonly auto-flagged until they build reputation.

## Plan

1. **Re-verify the domain in Search Console** using the connected Google account:
   - Request a fresh meta-tag verification token from Google.
   - Add the exact `<meta name="google-site-verification">` tag to the site's root `<head>` (in `src/routes/__root.tsx`), preserving any existing tags.
   - Publish, confirm the tag is live on https://globalbioenergywatch.org/, then call Google's verify endpoint and add the property.
2. **Submit the sitemap** (`https://globalbioenergywatch.org/sitemap.xml`) to the verified property.
3. **Check the Security & Manual Actions state**: once verified, review what Search Console reports for the domain (Security Issues, Manual Actions). If Google flags specific pages or content, fix or dispute them; if nothing is flagged, the "risky" label is a new-domain reputation issue and we request a review.
4. **If a Safe Browsing flag is confirmed**: clean the flagged item if real, then use Search Console's "Request Review" so Google re-scans and lifts the warning.

## Technical details

- Uses the existing linked connection "Asiful's Google Search Console" via the connector gateway — no new credentials needed.
- Requires one publish after adding the verification meta tag.
- Search Console API cannot read Security Issues directly; verification is the prerequisite to see and resolve them in the Search Console UI.

# Deployment setup

## 1. Supabase
1. Create a Supabase project in the dashboard.
2. Open SQL Editor and run `supabase/migrations/001_init.sql`.
3. Save the Project URL and anon/public key.
4. Do not put the service_role key in browser code, GitHub, or Worker variables.

## 2. Cloudflare Worker
1. Install Node.js LTS locally and run `npm install`.
2. Run `npx wrangler login` and complete Cloudflare authorization.
3. Set secrets: `npx wrangler secret put SUPABASE_URL` and `npx wrangler secret put SUPABASE_ANON_KEY`.
4. Run `npm run dev` for local preview.
5. Run `npm run deploy` to publish.

## 3. Custom domain
Add the domain in Cloudflare only after confirming ownership and DNS access. The desired public brand domain is SUHAS.COM; domain registration itself is not guaranteed free.

## 4. Required before production
- Complete server-side checkout using a transactional database function.
- Never trust client-submitted product prices or totals.
- Add authenticated seller/admin workflows and strict role provisioning.
- Verify payment webhooks with provider signatures.
- Add delivery, returns, refunds, audit logs and support.
- Test RLS policies with anonymous, customer, seller and admin accounts.
- Configure backups and quota alerts.

## Credentials
Use Cloudflare encrypted Worker secrets and Supabase dashboard settings. Never send secret keys in chat or commit them to Git.

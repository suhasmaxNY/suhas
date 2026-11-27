# SUHAS deployment setup

## Official public website
The only official public-facing website and app URL is:

https://suhasny.pages.dev

Do not publish backend/API endpoints as alternate website links. They remain implementation details.

## 1. Supabase
1. Open the Supabase project dashboard and SQL Editor.
2. Run `supabase/migrations/001_init.sql` and then `002_security_hardening.sql`.
3. Store the project URL and anon/publishable key in the appropriate Cloudflare configuration.
4. Never put the service_role key in browser code, GitHub, or public frontend variables.

## 2. Cloudflare Worker
1. The API Worker is `suhas-marketplace-api`.
2. Configure `SUPABASE_ANON_KEY` as an encrypted Worker Secret.
3. Keep backend/API addresses out of customer-facing navigation and documentation links.
4. Deploy updates through the connected GitHub/Cloudflare workflow.

## 3. Required before production
- Complete server-side checkout using a transactional database function.
- Never trust client-submitted product prices or totals.
- Add authenticated seller/admin workflows and strict role provisioning.
- Verify payment webhooks with provider signatures.
- Add delivery, returns, refunds, audit logs and support.
- Test RLS policies with anonymous, customer, seller and admin accounts.
- Configure backups and quota alerts.

## Credentials
Use Cloudflare encrypted Worker secrets and Supabase dashboard settings. Never send secret keys in chat or commit them to Git.

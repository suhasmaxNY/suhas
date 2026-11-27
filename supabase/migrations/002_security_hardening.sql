-- SUHAS.COM security hardening patch
-- Prevent customer self-escalation into admin and seller self-approval.
-- Apply after 001_init.sql.

revoke update on public.profiles from authenticated;
grant update (full_name, phone, preferred_locale, updated_at) on public.profiles to authenticated;

revoke update on public.sellers from authenticated;
grant update (store_name, slug, description) on public.sellers to authenticated;

-- Seller status and commission_percent are intentionally not client-writable.
-- Admin provisioning and seller approval must be performed by a trusted server-side
-- administrative process using a secret that is never exposed to the browser.

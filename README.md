# SUHAS.COM — Bangladesh-first marketplace

A multi-vendor marketplace foundation built only with GitHub, Cloudflare Workers/Static Assets and Supabase.

## Current foundation
- Responsive storefront with Bangla/English UI, search, category filters and cart.
- Product catalogue is seeded with clearly marked demo products.
- Cloudflare Worker API scaffold with health endpoint and Supabase connection placeholders.
- Supabase PostgreSQL schema with profiles, sellers, categories, products, variants, carts, orders, order items and reviews.
- Row Level Security (RLS) policies and helper functions.
- No payment is processed in this starter. COD is represented as an order method; online gateways require approved provider credentials.

## Stack
- Frontend: vanilla HTML/CSS/JavaScript in `public/`
- Edge/API: Cloudflare Workers
- Database/Auth: Supabase Postgres + Supabase Auth
- Source control: GitHub

## Local preview
Open `public/index.html` in a browser. For Worker development:
```bash
npm install
npx wrangler dev
```

## Deploy (free-tier aware)
1. Create a Supabase project and run `supabase/migrations/001_init.sql` in the SQL Editor.
2. Set Cloudflare Worker secrets: `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Never commit secrets.
3. Deploy from this repository using Cloudflare Workers with Static Assets, or run `npx wrangler deploy`.
4. Configure the custom domain only after DNS access is approved.

## Free-tier note
Free plans have quotas, limits, and suspension/pausing rules. This project does not promise unlimited free usage and must not automatically upgrade to a paid plan. Monitor quotas before launch.

## Production checklist
- Replace demo products and business copy with verified catalogue and company details.
- Add seller onboarding review, admin role provisioning and operational audit.
- Add payment gateway only after provider approval and webhook verification.
- Configure shipping partners, tax rules, refund workflows and customer support.
- Run security, accessibility, load and backup/restore tests before public launch.

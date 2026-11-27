# SUHAS.COM — Bangladesh-first marketplace

**Official website and app:** https://suhasny.pages.dev

This is the single public-facing website address for SUHAS. Backend/API services remain private implementation details and are not alternate storefront links.

A multi-vendor marketplace foundation built only with GitHub, Cloudflare and Supabase.

## Current foundation
- Responsive storefront with Bangla/English UI, search, category filters and cart.
- Product catalogue is seeded with clearly marked demo products.
- Cloudflare Worker API scaffold with health endpoint and Supabase connection.
- Supabase PostgreSQL schema with profiles, sellers, categories, products, variants, carts, orders, order items and reviews.
- Row Level Security (RLS) policies and helper functions.
- No payment is processed in this starter. COD is represented as an order method; online gateways require approved provider credentials.

## Stack
- Frontend: HTML/CSS/JavaScript in `public/`
- Edge/API: Cloudflare Workers
- Database/Auth: Supabase Postgres + Supabase Auth
- Source control: GitHub

## Local preview
Open `public/index.html` in a browser. For Worker development:
```bash
npm install
npx wrangler dev
```

## Deployment
The only official public storefront URL is https://suhasny.pages.dev.
Backend service URLs are not customer-facing website links.

## Free-tier note
Free plans have quotas, limits, and suspension/pausing rules. This project does not promise unlimited free usage and must not automatically upgrade to a paid plan. Monitor quotas before launch.

## Production checklist
- Replace demo products and business copy with verified catalogue and company details.
- Add seller onboarding review, admin role provisioning and operational audit.
- Add payment gateway only after provider approval and webhook verification.
- Configure shipping partners, tax rules, refund workflows and customer support.
- Run security, accessibility, load and backup/restore tests before public launch.

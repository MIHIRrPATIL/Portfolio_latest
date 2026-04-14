# Integrations

## Overview
The codebase currently represents a self-contained front-end application without heavy reliance on external microservices or third-party backend integrations, though some API routes exist for internal functionality.

## Third-Party Services
Given the dependencies listed, there are currently no major external SaaS APIs (like Supabase, Firebase, Stripe, etc.) directly defined in `package.json`. The stack is primarily focused on the frontend presentation layer.

## Internal APIs
- Standard Next.js Route Handlers (`app/api/`) may be used to serve local data or handle forms natively within the Vercel/Next.js environment.

## Hosting & CI/CD
- Designed for standard Next.js deployment models (e.g., Vercel, Netlify).

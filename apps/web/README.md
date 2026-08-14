This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Local development (domain-based i18n)

Locale is determined by the **domain**, not a URL prefix (`/en`, `/nl` are not
used). In production `offermarket.eu` → English and `offermarket.nl` → Dutch.
Locally, two subdomains stand in for those domains (configured in
`src/i18n/routing.ts`):

| URL                                    | Locale  |
| -------------------------------------- | ------- |
| `http://offermarket.localhost:3000`    | English |
| `http://offermarket-nl.localhost:3000` | Dutch   |

The `*.localhost` suffix resolves to `127.0.0.1` automatically on **macOS**, so
no extra setup is needed. On **Linux**, add these entries to `/etc/hosts`:

```
127.0.0.1 offermarket.localhost
127.0.0.1 offermarket-nl.localhost
```

The `LanguageSwitcher` navigates between these domains, preserving the current
path. `http://localhost:3000` itself still works but always renders the default
locale (English) — use the subdomains above to exercise both locales.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

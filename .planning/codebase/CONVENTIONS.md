# Coding Conventions

## File Naming
- **React components**: Primarily use PascalCase (e.g., `Hero.tsx`, `Projects.tsx`, `CardSwap.tsx`).
- **UI primitives**: Mixed convention, with some shadcn-imported files likely using kebab-case (e.g., `about-section.tsx`, `vertical-cut-reveal.tsx`) and some using PascalCase. Recommend standardizing grouping rules.

## React Code Style
- **Functional components**: Standard use of functional components and hooks.
- **Client boundaries**: components requiring browser APIs, WebGL, or complex interaction states have the `'use client'` directive at the top.

## Styling Approach
- **Tailwind CSS**: The main approach to styling.
- **clsx / tailwind-merge**: Used heavily in UI primitives to merge class names dynamically to avoid conflicts.
- **Animations**: Prefer `framer-motion` for declarative layout changes. Use GSAP for scroll-triggered timelines and more imperative animation sequences. Lengthy GSAP timelines are contained within `useEffect` or `useIsomorphicLayoutEffect` inside specific wrapper components.

## Linting
- Project enforces ESLint configured specifically for Next.js (`eslint-config-next`, strict mode).

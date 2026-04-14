# Architecture

## Core Patterns
- **Next.js App Router**: Utilizes the modern App Router (`app/`) architecture for handling layouts, pages, and API routes.
- **Component-Driven Design**: The application is highly modular. The UI is assembled from small, focused components located in the `components/` directory (categorized into `global`, `sections`, `ui`, and top-level page components).
- **Client-Side vs Server-Side**: Assumes standard Next.js behavior. components requiring heavy interactivity, WebGL (Three.js), and browser APIs (Framer Motion, Lenis) are marked with `"use client"`.

## High-Level Modules
- **`app/`**: Contains the route configuration and top-level pages.
- **`components/`**: 
  - **Sections**: Top-level page blocks like `Hero.tsx`, `About.tsx`, `Projects.tsx`, `Dashboard.tsx`.
  - **Shared/Global**: components used across the app (Cursor, Parallax background, Nav).
  - **UI/Shadcn**: Lower-level primitive components.
- **State Management**: Primarily relies on React local state and component properties. Some context might be used for global visual states (like dark mode or lenis scroll context).
- **Animation Layer**: Advanced animations are separated into specific components (e.g., `AnimatedList.tsx`, `ScrollStack.tsx`, `CardSwap.tsx`) wrapping standard elements.

## Data Flow
- Standard unidirectional React data flow. Data is passed from route `page.tsx` downwards into constituent components.

# Stack

## Overview
This is a modern Next.js React application with a strong emphasis on visuals, 3D graphics, and animations.

## Core Framework
- **Next.js (v16.2.1)**: React framework with App Router.
- **React & ReactDOM (v19.2.4)**: UI library.
- **TypeScript**: Static typing throughout the client.

## Styling & Animations
- **Tailwind CSS (v4)**: Utility-first CSS framework.
- **Framer Motion**: For complex layout animations and transitions.
- **GSAP**: For advanced scroll-driven and timeline animations.
- **Lenis**: Smooth scrolling engine.
- **Three.js & React Three Fiber (@react-three/drei, @react-three/fiber)**: 3D graphics rendering on the web.
- **tw-animate-css**: Tailwind animation utilities.

## UI Components & Icons
- **Radix UI**: Unstyled, accessible UI primitives.
- **shadcn**: Reusable component system using Radix and Tailwind.
- **Lucide React & React Icons**: Icon libraries.
- **class-variance-authority (cva) & clsx**: For composable and dynamic styling via Tailwind merge.

## Architecture Patterns
- **Directory Structure:** Standard Next.js App Router pattern (`app/` dir). `components/` directory handles reusable components.
- **State Management:** React hooks and Context (where needed).
- **Styling Method:** TailwindCSS configured alongside custom global CSS definitions.

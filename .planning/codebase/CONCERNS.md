# Technical Concerns

## Performance & Bundle Size
- **Heavy Animation Libraries**: The project utilizes multiple concurrent heavy animation/3D libraries, including `three.js`, `@react-three/drei`, `@react-three/fiber`, `framer-motion`, and `gsap`.
- **Mitigation Needed**: Ensure components are heavily code-split / dynamically imported using Next.js `next/dynamic` so users aren't downloading the massive Three.js boundary on navigation unless necessary.

## Maintenance & Conventions
- **Component Naming Inconsistencies**: The `components/ui/` folder has a split between `kebab-case` and `PascalCase` filenames.
- **Testing Vacuum**: Without test infrastructure, debugging highly complex imperative and declarative animation overlap bugs becomes heavily manual.

## Accessibility
- Advanced implementations using `lenis` for smooth scrolling and complex DOM manipulations for WebGL typically break native browser accessibility flows. Focus management and screen reader support must be actively tested in custom interactive elements.

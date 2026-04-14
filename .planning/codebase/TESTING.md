# Testing

## Overview
Currently, the codebase does not have an established automated testing infrastructure. There are no test runners (like Jest or Vitest) or test utility libraries (like React Testing Library or Cypress) listed in the `package.json` dependencies.

## Status
- **Unit Testing**: Not configured.
- **Component / Integration Testing**: Not configured.
- **End-to-End (E2E) Testing**: Not configured.

## Recommendations for Future Phases
1. Implement **Vitest** + **React Testing Library** for low-level component rendering checks, especially for UI primitives and logic hooks.
2. Implement visual regression testing or **Playwright** for E2E testing to ensure the WebGL and complex animation flows render predictably across viewport sizes.
3. Establish a standard `__tests__` or `*.test.tsx` file structure alongside or within the `components/` directories.

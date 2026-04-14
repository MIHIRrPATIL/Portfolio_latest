# Project Structure

## Directory Map

```text
/client
├── app/
│   ├── api/            # Route handlers / Server API
│   ├── projects/       # Nested routes for projects
│   ├── globals.css     # Global styles and tailwind directives
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/
│   ├── global/         # Shared global components
│   ├── sections/       # Distinct sections of pages
│   ├── ui/             # Reusable primitive UI components (from shadcn-ui)
│   ├── About.tsx       # About page block
│   ├── Hero.tsx        # Hero section block
│   ├── Projects.tsx    # Projects listing block
│   ├── Dashboard.tsx   # Dashboard/Analytics section
│   ├── Folder.tsx      # Folders layout element
│   └── [Various animation and structural components]
├── package.json        # Project manifest and scripts
└── public/             # Static assets (images, fonts, 3D models)
```

## Key Modules
- **Layout and Pages**: Driven by `app/layout.tsx` and `app/page.tsx` establishing the core document structure and entry point.
- **Presentational Blocks**: Found directly inside `components/` - things like `Hero.tsx`, `About.tsx`, `Projects.tsx`.
- **Animation Primitives**: components like `AnimatedList.tsx`, `CardSwap.tsx`, `ScrollStack.tsx` that wrap children with Framer Motion or GSAP behaviors.

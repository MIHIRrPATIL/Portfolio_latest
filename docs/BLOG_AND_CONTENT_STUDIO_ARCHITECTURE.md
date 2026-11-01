# Blog & Content Studio Architecture

## 1. System Overview

The Blog & Content Management System in the Portfolio platform provides a full-featured writing, editing, and publishing environment. It bridges technical markdown authoring with rich text formatting (tables, diagrams, callout blocks, syntax highlighting) and connects directly to the Supabase PostgreSQL backend.

```mermaid
graph TD
    A[Admin Dashboard /admin] -->|Open Studio| B[Blog Studio /admin/blogs/editor]
    B -->|Live Preview| C[MarkdownRenderer]
    B -->|FastAPI Admin API| D[Supabase PostgreSQL: blogs table]
    D -->|FastAPI Public API| E[Public Reader /blogs and /blogs/:slug]
    E -->|Render Content| C
```

---

## 2. Component Hierarchy & File Map

| Component / File | Purpose | Route / Layer |
| :--- | :--- | :--- |
| `client/app/admin/blogs/editor/page.tsx` | Full-screen Markdown Studio with live preview, toolbar, telemetry, and meta drawer | `/admin/blogs/editor` |
| `client/components/MarkdownRenderer.tsx` | Custom AST Markdown parser supporting GFM tables, GitHub callouts, and diagrams | Shared Component |
| `client/app/admin/page.tsx` | Main administrative control panel with direct Studio deep-linking | `/admin` |
| `client/app/blogs/page.tsx` | Public article catalog with search query filter and tag pills | `/blogs` |
| `client/app/blogs/[slug]/page.tsx` | Public reader page rendering full post with telemetry and share capabilities | `/blogs/[slug]` |
| `server/app/db/models.py` (`BlogModel`) | SQLAlchemy ORM definition for `blogs` table | Database Layer |
| `server/app/api/v1/public_content.py` | Public endpoints for retrieving published blogs and incrementing view metrics | Public API Layer |
| `server/app/api/v1/admin.py` | Authenticated endpoints for CRUD operations on blog posts | Admin API Layer |

---

## 3. Data Model & Database Schema

The `blogs` table is persisted in Supabase PostgreSQL via SQLAlchemy:

```python
class BlogModel(Base):
    __tablename__ = "blogs"

    id = Column(String(255), primary_key=True, index=True)   # Serves as unique slug
    title = Column(String(512), nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=True)                    # Full Markdown body
    cover_image = Column(String(1024), nullable=True)
    external_url = Column(String(1024), nullable=True)       # Cross-post URL
    tags = Column(JSON, default=list)                        # List of topic strings
    read_time = Column(String(50), default="3 min read")
    is_published = Column(Boolean, default=True, index=True)
    views = Column(Integer, default=0)
    published_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
```

---

## 4. Markdown & Rich Formatting Specifications

The parser in `client/components/MarkdownRenderer.tsx` converts markdown tokens into styled Tailwind CSS elements:

1. **GFM Tables**:
   - Parses `| Col 1 | Col 2 |` syntax with separator row detection (`|:---|:---|`).
   - Renders with responsive overflow wrapping, styled headers, and alternating hover rows.

2. **GitHub-Style Callout Alerts**:
   - Supports `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, and `> [!CAUTION]`.
   - Renders themed color borders, backgrounds, and designated Lucide icons.

3. **Mermaid Architecture Diagrams**:
   - Code blocks tagged ````mermaid` render a specialized architecture block with a one-click "Copy Diagram Spec" button.

4. **Syntax Highlighting & Code Blocks**:
   - Monospace font styling with language badge and copy-to-clipboard button.

5. **Task Lists**:
   - Supports `- [ ]` and `- [x]` checkboxes.

6. **Typography & Inline Elements**:
   - Auto-detected links with external indicator icons, bold, italic, inline code chips, and image captions.

---

## 5. Studio Features (`/admin/blogs/editor`)

The Studio interface provides:

- **Authentication Gate**: Validates administrative passkey against `/api/v1/admin/auth/verify` and persists session token in `sessionStorage`.
- **Tri-Mode Viewport**:
  - `Split View`: Synchronous 50/50 editor and live preview pane.
  - `Editor Only`: Distraction-free writing.
  - `Preview Only`: Full-width reader simulation.
- **Formatting Toolbar**: Quick-insertion buttons for Headings (H1, H2, H3), bold, italic, inline code, quotes, unordered/ordered lists, task lists, GFM tables, GitHub callouts, and Mermaid diagrams.
- **Real-Time Telemetry**: Real-time word count, character count, estimated reading time, and unsaved changes indicator.
- **Article Switcher**: Top navigation dropdown to switch between existing articles or initialize a new blank draft.
- **Metadata Drawer**: Slide-over panel to configure title, slug ID, summary, cover image with preview, tag management with suggestions, read time, and immediate publication toggle.

---

## 6. Scroll Architecture & Admin Shell Isolation

1. **Lenis Inertial Scroll Bypassing**:
   - The global `LenisProvider` automatically detects `/admin` routes via `usePathname()`.
   - On `/admin` and `/admin/blogs/editor`, Lenis is destroyed and deactivated so all textareas, modals, dropdowns, and split panes retain 100% native browser scroll behavior without wheel-event hijacking.
   - For public routes, Lenis includes a `prevent` filter callback protecting elements tagged with `data-lenis-prevent`, `.custom-scrollbar`, `textarea`, `pre`, and `code`.

2. **Admin UI Shell Isolation**:
   - `AppShell` conditionally hides public navigation artifacts on all `/admin` routes:
     - **Hamburger Corner Menu Button** (`SideNav.tsx`) is hidden.
     - **Mihir 2026 Brand Emblem** (`BrandLogo.tsx`) is hidden.
     - **Visitor AI Copilot Widget** (`AgentChatWidget.tsx`) is hidden.
     - **PageLoader** and **ScrollProgress** are hidden.
   - Any residual modal locks or `overflow: hidden` states on `document.body` are reset to clean empty strings on route entry.


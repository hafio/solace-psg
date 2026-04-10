# Solace Brand & Theme Reference

> Based on **Solace Brand Book 2025 v3.0** and the Solace Message Utility app implementation.
> Sections marked **(Brand Book)** come from the official guide. Sections marked **(App)** are implementation-specific choices from this project.

---

## 1. Brand Identity

### Vision

> To become the digital nervous system for the real-time, event-driven, agentic world, empowering every enterprise to move, think, and act at the speed of now.

### Brand Voice

> We are your friendly enterprise architect. We translate complex technical concepts into clear, accessible language. We bridge the worlds of business and development with equal fluency.

### Brand Attributes

1. **Passionate** -- We care deeply about building better systems
2. **Problem-solvers** -- We untangle complexity and bring clarity
3. **Approachable** -- No jargon, no ego -- just understanding and support
4. **Insightful** -- We connect the dots others miss
5. **Reliable** -- We show up, follow through, and stay steady
6. **Bridge-builders** -- We turn silos into synergies

---

## 2. Logo (Brand Book)

- **Logotype font origin**: ITC Souvenir with custom-stylized "s", "a", and "e" letterforms
- **Approved logo colors**: Classic Green, Deep Blue, or White only
- **Clear space**: 1.5x the height of the lowercase "s" on all sides
- **Minimum size**: 70px or 25mm wide
- **Rules**:
  - Always use as a solid color -- no gradients on the logo itself
  - Never change the logotype font, stretch, outline, or add effects (drop shadows, glow)
  - Ensure WCAG AA contrast ratio compliance against the background
  - For photos: place over high-contrast areas or use a branded shape to create contrast

### Co-branding

- Partner logos at equal scale, separated by a thin vertical line
- Prefer one-color lockups to simplify palette

### "S" Icon

- Use the standalone "S" for favicons, circle/square social icons, and small-format placements
- Available in Light, Bright, and Dark variants

---

## 3. Color Palette (Brand Book)

### Primary Colors

| # | Swatch | Official Name | Hex | RGB | CMYK | Pantone |
|---|--------|--------------|-----|-----|------|---------|
| 01 | ![#00C895](https://placehold.co/24x24/00C895/00C895) | **Classic Green** | `#00C895` | 0, 200, 149 | 71-0-55-0 | 3395 |
| 02 | ![#ABFF88](https://placehold.co/24x24/ABFF88/ABFF88) | **Bright Green** | `#ABFF88` | 171, 255, 136 | 45-0-70-0 | 366 |
| 03 | ![#093B5F](https://placehold.co/24x24/093B5F/093B5F) | **Deep Blue** | `#093B5F` | 9, 59, 95 | 100-78-38-27 | 302 |
| 04 | ![#03213B](https://placehold.co/24x24/03213B/03213B) | **Dark Blue** | `#03213B` | 8, 34, 60 | 96-85-50-54 | 2965 |
| 05 | ![#FFFFFF](https://placehold.co/24x24/FFFFFF/FFFFFF) | **White** | `#FFFFFF` | 255, 255, 255 | 0-0-0-0 | -- |

### Secondary Colors

| # | Swatch | Official Name | Hex | RGB | CMYK | Pantone |
|---|--------|--------------|-----|-----|------|---------|
| 06 | ![#C7FFCB](https://placehold.co/24x24/C7FFCB/C7FFCB) | **Spring Green** | `#C7FFCB` | 199, 255, 203 | 15-0-30-0 | -- |
| 07 | ![#C2F7FF](https://placehold.co/24x24/C2F7FF/C2F7FF) | **Sky Blue** | `#C2F7FF` | 194, 247, 255 | 20-0-2-0 | -- |
| 08 | ![#FFF7C2](https://placehold.co/24x24/FFF7C2/FFF7C2) | **Sunrise Yellow** | `#FFF7C2` | 255, 247, 194 | 1-1-29-0 | -- |
| 09 | ![#009193](https://placehold.co/24x24/009193/009193) | **Dark Green** | `#009193` | 0, 145, 147 | 82-23-43-0 | 6138 |
| 10 | ![#FCA829](https://placehold.co/24x24/FCA829/FCA829) | **Orange** | `#FCA829` | 252, 168, 41 | 0-38-94-0 | 4008 |

### Grays

| # | Swatch | Official Name | Hex | RGB | CMYK |
|---|--------|--------------|-----|-----|------|
| 12 | ![#F4F4F4](https://placehold.co/24x24/F4F4F4/F4F4F4) | **Cool Gray 12** | `#F4F4F4` | 244, 244, 244 | 3-2-2-0 |
| 13 | ![#EAEAEA](https://placehold.co/24x24/EAEAEA/EAEAEA) | **Cool Gray 13** | `#EAEAEA` | 234, 234, 234 | 7-5-5-0 |
| 14 | ![#D6D6D6](https://placehold.co/24x24/D6D6D6/D6D6D6) | **Cool Gray 14** | `#D6D6D6` | 214, 214, 214 | 15-11-12-0 |

### Gradients

| # | Name | Definition |
|---|------|-----------|
| 15 | **Solace Gradient** | Bright Green (`#ABFF88`) >>> Classic Green (`#00C895`) |
| 16 | **Solace Gradient** | Dark Green (`#009193`) >>> Deep Blue (`#093B5F`) |
| 17 | **Solace Gradient** | Deep Blue (`#093B5F`) >>> Dark Blue (`#03213B`) |

### Color Usage Rules (Brand Book)

1. **Don't** use only pastels/lighter shades together -- always pair with primary palette colors
2. **Never** combine two or more secondary colors together -- each secondary should pair with primary green
3. **Never** use secondary colors for body/headline copy text
4. Monotone artworks are acceptable only with green palette from secondary colors

---

## 4. Color Modes (Brand Book)

The brand supports three modes. Select **one color per category** (text, primary/background, secondary/solid fill, accent/outline) per mode. Developer tools and code should **always be displayed in dark mode**.

### Light Mode

| Role | Colors |
|------|--------|
| **Text** | Deep Blue (`#093B5F`) or Dark Blue (`#03213B`) |
| **Primary (Background)** | White (`#FFFFFF`) or light pastels |
| **Secondary (Solid Fill)** | Spring Green, Sky Blue, Sunrise Yellow |
| **Accent (Outline)** | Classic Green (`#00C895`) |

### Bright Mode

| Role | Colors |
|------|--------|
| **Text** | Deep Blue (`#093B5F`) or Dark Blue (`#03213B`) or White |
| **Primary (Background)** | Classic Green (`#00C895`) or Bright Green (`#ABFF88`) |
| **Secondary (Solid Fill)** | Deep Blue, Dark Blue, or pastels |
| **Accent (Outline)** | White or Deep Blue |

### Dark Mode

| Role | Colors |
|------|--------|
| **Text** | White, Classic Green, or Bright Green |
| **Primary (Background)** | Dark Blue (`#03213B`) or Deep Blue (`#093B5F`) |
| **Secondary (Solid Fill)** | Dark Green (`#009193`) or Classic Green |
| **Accent (Outline)** | Classic Green or Bright Green |

---

## 5. Accessibility (Brand Book)

WCAG 2.1 requirements:
- **AA Text**: 4.5:1 regular text, 3:1 large text (18pt or 14pt bold)
- **AA Non-Text**: 3:1 for UI components & graphics
- **AAA Text**: 7:1 regular text, 4.5:1 large text

### Passing Combinations (AA regular text, 4.5:1+)

| Text Color | Background | Ratio | Rating |
|-----------|-----------|-------|--------|
| Classic Green (`#00C895`) | Deep Blue (`#093B5F`) | 5.38:1 | AA |
| Classic Green (`#00C895`) | Dark Blue (`#03213B`) | 7.48:1 | AAA |
| Bright Green (`#ABFF88`) | Deep Blue (`#093B5F`) | 9.65:1 | AAA |
| Bright Green (`#ABFF88`) | Dark Blue (`#03213B`) | 13.33:1 | AAA |
| Deep Blue (`#093B5F`) | White (`#FFFFFF`) | 11.65:1 | AAA |
| Deep Blue (`#093B5F`) | Spring Green (`#C7FFCB`) | 10.32:1 | AAA |
| Deep Blue (`#093B5F`) | Sky Blue (`#C2F7FF`) | 10.01:1 | AAA |
| Deep Blue (`#093B5F`) | Sunrise Yellow (`#FFF7C2`) | 10.73:1 | AAA |
| Deep Blue (`#093B5F`) | Orange (`#FCA829`) | 5.98:1 | AA |
| Deep Blue (`#093B5F`) | Bright Green (`#ABFF88`) | 9.65:1 | AAA |
| Dark Blue (`#03213B`) | White (`#FFFFFF`) | 16.10:1 | AAA |
| Dark Blue (`#03213B`) | Spring Green (`#C7FFCB`) | 14.26:1 | AAA |
| Dark Blue (`#03213B`) | Sky Blue (`#C2F7FF`) | 13.83:1 | AAA |
| Dark Blue (`#03213B`) | Sunrise Yellow (`#FFF7C2`) | 14.82:1 | AAA |
| Dark Blue (`#03213B`) | Bright Green (`#ABFF88`) | 13.33:1 | AAA |
| Dark Blue (`#03213B`) | Orange (`#FCA829`) | 8.26:1 | AAA |
| White (`#FFFFFF`) | Deep Blue (`#093B5F`) | 11.65:1 | AAA |
| White (`#FFFFFF`) | Dark Blue (`#03213B`) | 16.10:1 | AAA |

### Common Failing Combinations (avoid for body text)

| Combination | Ratio | Note |
|-------------|-------|------|
| Classic Green on White | 2.17:1 | Use as accent/UI only, not body text |
| Classic Green on Dark Green | 1.77:1 | Insufficient contrast |
| Bright Green on White | 1.21:1 | Decorative use only |
| Secondary pastels on each other | < 1.2:1 | Never pair pastels together for text |

---

## 6. Typography (Brand Book)

### Font Stack

| Role | Font | Weights | Usage |
|------|------|---------|-------|
| **H1, H2 Headlines** | **New Spirit** (serif) | Light, Bold | Primary headlines; use at large sizes; title case only, never all-caps |
| **H3-H5, Body** | **Figtree** (sans-serif) | Regular, Bold | Secondary headlines, all body copy, UI elements (buttons, labels) |
| **Code & Support** | **Space Mono** (monospace) | Regular, Bold | Overlines, code snippets, compact UI; keep at 16pt or smaller |

### Fallback Fonts (Microsoft / System)

| Brand Font | MS Fallback | Web Fallback |
|-----------|-------------|--------------|
| New Spirit | -- (no direct equivalent) | Georgia, serif |
| Figtree | Segoe UI | system-ui, -apple-system, sans-serif |
| Space Mono | Cascadia Mono, Aptos Mono | monospace |

### Font Sources

- **New Spirit**: Licensed/commercial serif
- **Figtree**: Free, open source -- [Google Fonts](https://fonts.google.com/specimen/Figtree)
- **Space Mono**: Free, open source -- [Google Fonts](https://fonts.google.com/specimen/Space+Mono)

### Type Hierarchy (Brand Book)

| Element | Font | Style | Notes |
|---------|------|-------|-------|
| Overline text | Space Mono | All caps | Classic Green on dark bg; Deep Blue on light bg |
| H1, H2 | New Spirit | Light weight | Title case, never all-caps |
| Sub-headline | Figtree | Regular + Bold | |
| H3, H4, H5 | Figtree | Bold | |
| Body copy | Figtree | Regular + Bold | |
| Buttons & labels | Figtree | Bold | |
| Code snippets | Space Mono | Regular | Max 16pt |

---

## 7. Visual Language (Brand Book)

### Brand Shapes

- Inspired by the idea of **data and its movement**
- **Solid fill shapes** = data
- **Outline shapes** = Solace platform/solution
- Can overlap with text if readability is maintained
- Can be scaled, cropped, or positioned to tie layout elements together
- Can serve as background elements or frame photography

### Iconography

- **Simple line icons** with a splash of Classic Green for energy
- Consistent line style across all icons
- Used to communicate complex ideas quickly

### Illustration Style

1. **Brand shapes** as background elements
2. **Solace Mesh** pattern applied to brand shapes where appropriate
3. **Outline brand shapes** for data representation (max 3 per illustration, 1px Deep Blue line)
4. **Hero illustration** as focal point -- can be isometric or flat style
5. **Line work** always in Deep Blue, always 1px weight
6. **Graphic elements** -- line/shadow in Deep Blue, fill in White
7. **Shadows** -- always Deep Blue, bold and intentional; consistent intensity per composition

### Illustration Types

| Type | Usage | Context |
|------|-------|---------|
| **Hero** | Larger, detailed, tells a full story | Website banners, social media, PPT covers |
| **Thumbnail** | Simpler, lighter visual weight | Web cards, social posts |

### Photography

- **High-contrast black & white** by default
- Color introduced through brand backgrounds or duotone overlays
- Candid, natural moments -- avoid stiff/posed shots
- Reflect diversity in backgrounds, genders, ages, abilities
- No cliche hacker shots, cheesy handshakes, or glowing code
- Industry photos should include people in context with data/technology elements

---

## 8. CSS Custom Properties -- App Implementation (App)

Copy into your `:root` for a project using the Solace brand. This maps official brand colors to semantic application tokens.

```css
:root {
    /* ── Solace Brand Palette (from Brand Book 2025 v3.0) ── */
    --solace-classic-green: #00C895;   /* Primary -- Pantone 3395 */
    --solace-bright-green:  #ABFF88;   /* Primary -- Pantone 366 */
    --solace-deep-blue:     #093B5F;   /* Primary -- Pantone 302 */
    --solace-dark-blue:     #03213B;   /* Primary -- Pantone 2965 */
    --solace-white:         #FFFFFF;

    --solace-spring-green:  #C7FFCB;   /* Secondary */
    --solace-sky-blue:      #C2F7FF;   /* Secondary */
    --solace-sunrise-yellow: #FFF7C2;  /* Secondary */
    --solace-dark-green:    #009193;   /* Secondary -- Pantone 6138 */
    --solace-orange:        #FCA829;   /* Secondary -- Pantone 4008 */

    --solace-gray-light:    #F4F4F4;   /* Cool Gray 12 */
    --solace-gray-mid:      #EAEAEA;   /* Cool Gray 13 */
    --solace-gray-dark:     #D6D6D6;   /* Cool Gray 14 */

    /* ── App Theme Mapping (Mellow Flat) ── */
    --bg-app:              #f8f9fa;    /* main content background */
    --bg-sidebar:          #03213B;    /* Dark Blue */
    --bg-header:           #ffffff;
    --bg-card:             #ffffff;
    --bg-input:            #f1f5f9;

    --text-primary:        #334155;    /* dark slate */
    --text-secondary:      #64748b;    /* medium slate */
    --text-muted:          #94a3b8;    /* light slate */

    --accent-primary:      #00C895;    /* Classic Green */
    --accent-secondary:    #009193;    /* Dark Green / Teal */
    --accent-hover:        #00a87d;    /* darker green for hover */
    --accent-text:         #ffffff;    /* text on accent backgrounds */

    --border-color:        #e2e8f0;

    /* ── Status ── */
    --status-connected:    #00C895;
    --status-disconnected: #ef4444;
    --status-warning:      #FCA829;    /* brand: Orange */
    --status-error:        #ef4444;

    /* ── Spacing & Layout ── */
    --sidebar-width:       260px;      /* collapses to 64px */
    --header-height:       64px;
    --radius-md:           6px;
    --radius-lg:           8px;

    /* ── Shadows ── */
    --shadow-sm:           0 1px 3px 0 rgb(0 0 0 / 0.1);
    --shadow-md:           0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

> **Note**: The app uses `Inter` for body text instead of the official `Figtree`. For full brand compliance, switch to Figtree for body/UI and New Spirit for H1/H2 headlines. The app also uses `#FCAB29` for orange in a few places -- the official brand value is `#FCA829`.

---

## 9. App Typography (App)

The current app implementation (for reference when matching existing UI):

| Property | Value |
|----------|-------|
| **Font Family** | `'Inter', system-ui, -apple-system, sans-serif` |
| **Base Size** | `0.9rem` -- `1rem` |
| **Weight Normal** | `400` |
| **Weight Bold** | `600` |

### Scale

| Element | Size | Weight | Extra |
|---------|------|--------|-------|
| Page title | `1.25rem` | `600` | |
| Sidebar header | `1.15rem` | `600` | |
| Body text / table cells | `0.9rem` | `400` | |
| Form labels | `0.875rem` | `400` | secondary color |
| Table headers | `0.75rem` | `600` | uppercase |
| Detail labels | `0.75rem` | `600` | uppercase, `letter-spacing: 0.05em` |
| Badges | `0.75rem` | `600` | uppercase |
| Status text | `0.85rem` | `400` | |
| Monospace output | `0.85rem` -- `0.9rem` | `400` | system monospace |

### Brand-compliant font setup

```css
/* Import from Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;700&family=Space+Mono:wght@400;700&display=swap');

/* New Spirit must be self-hosted or licensed separately */

:root {
    --font-headline: 'New Spirit', Georgia, serif;
    --font-body:     'Figtree', 'Segoe UI', system-ui, sans-serif;
    --font-mono:     'Space Mono', 'Cascadia Mono', monospace;
}

h1, h2       { font-family: var(--font-headline); font-weight: 300; /* Light */ }
h3, h4, h5   { font-family: var(--font-body); font-weight: 700; }
body          { font-family: var(--font-body); font-weight: 400; }
code, pre,
.overline     { font-family: var(--font-mono); }
.overline     { text-transform: uppercase; font-size: 0.75rem; }
```

---

## 10. Spacing (App)

| Token | Value |
|-------|-------|
| gap-1 | `0.25rem` (4px) |
| gap-2 | `0.5rem` (8px) |
| gap-3 | `0.75rem` (12px) |
| gap-4 | `1rem` (16px) |
| Padding small | `0.5rem` |
| Padding medium | `1rem` |
| Padding large | `1.5rem` |

---

## 11. Borders & Radii (App)

| Token | Value |
|-------|-------|
| Default border | `1px solid #e2e8f0` |
| radius-md | `6px` (buttons, inputs, cards) |
| radius-lg | `8px` (modals, main cards) |
| Badge/tag radius | `4px` |
| Circle (toggle btn) | `50%` |

---

## 12. Shadows (App)

| Name | Value | Usage |
|------|-------|-------|
| Small | `0 1px 3px 0 rgb(0 0 0 / 0.1)` | Cards, subtle elevation |
| Medium | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Modals, dropdowns |

---

## 13. Transitions (App)

| Context | Value |
|---------|-------|
| General hover | `all 0.2s ease` |
| Sidebar expand/collapse | `width 0.3s cubic-bezier(0.4, 0, 0.2, 1)` |
| Status icon | `color 0.3s ease, filter 0.3s ease` |
| Spinner | `spin 0.8s linear infinite` |

---

## 14. Component Patterns (App)

### Buttons

```css
.btn {
    padding: 0.625rem 1.25rem;
    border-radius: var(--radius-md);   /* 6px */
    font-weight: 700;
    font-size: 0.95rem;
    transition: all 0.2s;
}
.btn-primary   { background: #00C895; color: #fff; }    /* hover: #00a87d */
.btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
.btn-danger    { background: #ef4444; color: #fff; }
```

### Cards

```css
.card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
```

### Inputs

```css
.form-control {
    padding: 0.625rem 0.875rem;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    color: #334155;
}
.form-control:focus { border-color: #00C895; }
```

### Sidebar

```css
.sidebar {
    width: 260px;            /* collapsed: 64px */
    background: #03213B;     /* Dark Blue */
    color: #ffffff;
}
.nav-item {
    padding: 0.65rem 1rem;
    color: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
}
.nav-item:hover  { background: rgba(255, 255, 255, 0.1); color: #fff; }
.nav-item.active { background: #009193; border-left: 3px solid #00C895; color: #fff; }
```

### Badges

```css
.badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
}
.badge-info    { background: rgba(14, 165, 233, 0.2);  color: #00C895; }
.badge-success { background: rgba(16, 185, 129, 0.2);  color: #00C895; }
```

### Tables

```css
.data-table th {
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    color: #64748b;
    border-bottom: 2px solid #e2e8f0;
    position: sticky; top: 0;
    background: #fff;
}
.data-table td {
    padding: 0.35rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    color: #334155;
}
tr.selected { background: #C7FFCB; }  /* Spring Green */
```

### Scrollbar

```css
::-webkit-scrollbar            { width: 8px; height: 8px; }
::-webkit-scrollbar-track      { background: #f8f9fa; }
::-webkit-scrollbar-thumb      { background: #e2e8f0; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

---

## 15. Additional App Colors (App)

These colors are used in the app implementation but are not part of the official brand palette:

| Hex | Context |
|-----|---------|
| `#00a87d` | Primary button hover (darker green) |
| `#475569` | Secondary button hover (dark slate) |
| `#334155` | Primary text (dark slate) |
| `#64748b` | Secondary text (medium slate) |
| `#94a3b8` | Muted text (light slate) |
| `#f8f9fa` | App background |
| `#f1f5f9` | Input field background |
| `#e2e8f0` | Border color |
| `#f8fafc` | Card-light background |
| `#cbd5e1` | Tag hover background |
| `#ef4444` | Error / disconnected status (standard red) |
| `#3dba91` | SVG logo fill (green variant -- not official) |
| `rgba(255, 255, 255, 0.1)` | Sidebar subtle borders & nav hover |
| `rgba(255, 255, 255, 0.7)` | Sidebar nav text |
| `rgba(0, 0, 0, 0.5)` | Modal backdrop overlay |
| `rgba(14, 165, 233, 0.2)` | Info badge background |
| `rgba(16, 185, 129, 0.2)` | Success badge background |
| `rgba(239, 68, 68, 0.1)` | Danger button hover tint |
| `rgba(16, 185, 129, 0.6)` | Connected icon glow |

---

## 16. Design Philosophy

### Brand Book Principles

- Three color modes: **Light**, **Bright**, **Dark** -- pick one per composition
- Developer tools and code: **always dark mode**
- One color per role category: text, background, secondary fill, accent outline
- Depth via **Deep Blue shadows** in illustrations, not heavy CSS drop-shadows
- **Line work** always 1px, always Deep Blue
- Icons are **line style with Classic Green accents**
- Photography is **high-contrast B&W** with brand color overlays

### App Implementation ("Mellow Flat" Theme)

- Clean, low-contrast surfaces with vibrant Solace brand accents
- White/off-white content areas; dark navy sidebar for contrast
- Classic Green (`#00C895`) as the dominant accent; Dark Green (`#009193`) as secondary; Orange (`#FCA829`) for warnings
- Three-tier slate text palette on light backgrounds; white with opacity on dark sidebar
- Minimal elevation -- small shadows on cards, medium on modals
- Consistent `6px` (inputs/buttons) and `8px` (cards/modals) border radius

# Landing Page Redesign — Design Spec

## Goal

Restyle the landing page, header, and footer to use the shadcn/ui base-nova palette exclusively. Remove all legacy custom CSS variables. Change locales from de/en to es/en.

## Decisions

- **Palette**: shadcn/ui CSS variables only (`background`, `foreground`, `card`, `muted`, `primary`, `border`, `chart-1` through `chart-5`). No custom CSS variables.
- **Components**: shadcn/ui primitives (`Card`, `Badge`, `Button`, `Separator`).
- **Accent strategy**: Use `chart-1` through `chart-5` for colored accents (prefix types, code highlights). These auto-flip with dark mode.
- **Landing sections**: 5 (Hero, Problem, Prefix Family, How It Works, CTA). "Works With" section removed.
- **Header**: Redesigned — minimal with brand, Playground link, theme toggle, locale switcher. Built from shadcn `Button` variants.
- **Footer**: Restyled and rebranded for "JSON with Superpowers" identity.
- **Locales**: de → es.
- **Code examples**: Reference real files from `src/examples/` instead of inline snippets.

## CSS Cleanup

### Remove from `src/styles.css`

- All legacy custom variables in `:root` block: `--sea-ink`, `--sea-ink-soft`, `--lagoon`, `--lagoon-deep`, `--palm`, `--sand`, `--foam`, `--surface`, `--surface-strong`, `--line`, `--inset-glint`, `--kicker`, `--bg-base`, `--header-bg`, `--chip-bg`, `--chip-line`, `--link-bg-hover`, `--hero-a`, `--hero-b`
- The entire `:root[data-theme="dark"]` block (legacy dark overrides)
- The entire `@media (prefers-color-scheme: dark)` block (duplicated legacy dark overrides)
- Legacy `body` styles: custom `color`, `background-color`, `background` gradients
- `body::before` and `body::after` pseudo-elements (decorative gradients/grid)
- Legacy `a` color styles
- Legacy `code` border/background styles using `var(--line)`, `var(--surface-strong)`
- All legacy utility classes: `.page-wrap`, `.display-title`, `.island-shell`, `.feature-card`, `.feature-card:hover`, `.island-kicker`, `.nav-link` (and all its states/pseudo-elements), `.site-footer`, `.rise-in` and its `@keyframes`
- The transition rule on `button, .island-shell, a`

### Keep in `src/styles.css`

- Font imports (Google Fonts for Manrope; keep Inter Variable from fontsource)
- Tailwind/shadcn imports (`tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`)
- `@custom-variant dark`
- `@plugin "@tailwindcss/typography"`
- `@theme { --font-sans }` block
- `:root` shadcn theme variables (oklch values: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--chart-*`, `--radius`, `--sidebar-*`)
- `.dark` block (shadcn dark theme variables)
- `@theme inline` block (Tailwind color/radius mappings)
- `@layer base` block (`border-border`, `bg-background text-foreground`, `font-sans`)
- Basic resets: `* { box-sizing: border-box }`, `html, body, #app { min-height: 100% }`

### Post-cleanup evaluation

- Check if Fraunces font import is still needed (only used by removed `.display-title`). Remove if unused.
- Check if `pre code` reset is still needed. Keep only if code blocks exist in landing.

## Header

**File**: `src/components/Header.tsx` — full rewrite.

**Structure:**
```
<header> sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border
  <div> max-w-5xl mx-auto px-6 h-14 flex items-center
    <Link to="/"> brand mark
      <span> monospace "{ @@ }" text-primary font-mono text-sm
      <span> "Superpowers" text-foreground font-semibold
    </Link>
    <div> ml-auto flex items-center gap-1
      <Button asChild variant="ghost" size="sm">
        <Link to="/playground">Playground</Link>
      </Button>
      <ThemeToggle />
      <LocaleSwitcher />
    </div>
  </div>
</header>
```

**Behavior:**
- Sticky with semi-transparent background and blur
- No dropdown menus, no demo links, no social links
- ThemeToggle and LocaleSwitcher keep existing functionality

## Footer

**File**: `src/components/Footer.tsx` — full rewrite.

**Structure:**
```
<footer> border-t border-border py-8
  <div> max-w-5xl mx-auto px-6 flex items-center justify-between
    <div> text-sm text-muted-foreground
      "JSON with Superpowers"
      "Built by Vizzuality Frontend Team"
    </div>
    <div> flex gap-2
      (GitHub link if applicable, using Button ghost variant)
    </div>
  </div>
</footer>
```

## Landing Sections

All sections use `max-w-5xl mx-auto px-6` for content width. Sections alternate between `bg-background` and `bg-muted` for visual separation.

### Hero (`src/components/landing/hero-section.tsx`)

- **Background**: `bg-background`, `py-24 sm:py-32`
- **Badge**: shadcn `Badge` variant="secondary" — "Vizzuality — Frontend Team"
- **Heading**: `text-4xl sm:text-5xl font-bold text-foreground` with "Superpowers" in `text-primary`
- **Subheading**: `text-lg text-muted-foreground max-w-2xl`
- **CTA**: shadcn `Button` default variant, `size="lg"` → Link to `/playground` — "Try the Playground"
- **Layout**: centered flex column, `items-center text-center`

### Problem (`src/components/landing/problem-section.tsx`)

- **Background**: `bg-muted`, `py-20`
- **Badge**: shadcn `Badge` variant="secondary" — "The Problem"
- **Heading**: `text-3xl font-bold text-foreground`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 gap-6`
- **Before card**: shadcn `Card` with `CardHeader` ("Before — Static JSON") and `CardContent` containing a code block. Left border accent using `border-l-4 border-chart-5` (darkest green).
  - Code content: extracted from a real example file (e.g., `01-raster-opacity.json`) showing hardcoded values
- **After card**: shadcn `Card` with `CardHeader` ("After — Dynamic JSON") and `CardContent` containing a code block. Left border accent using `border-l-4 border-chart-1` (brightest green).
  - Code content: the same example showing `@@#params` references
- **Code blocks**: `bg-card rounded-md p-4 font-mono text-sm text-card-foreground overflow-x-auto`

### Prefix Family (`src/components/landing/prefix-family-section.tsx`)

- **Background**: `bg-background`, `py-20`
- **Badge**: shadcn `Badge` variant="secondary" — "The @@ Prefix Family"
- **Heading**: `text-3xl font-bold text-foreground` — "One convention, five capabilities"
- **Content**: 5 rows, each separated by shadcn `Separator`
- **Each row**: flex layout
  - Prefix in monospace: `font-mono font-semibold` colored with `text-chart-N` (one per prefix, chart-1 through chart-5)
  - Description: `text-muted-foreground`
  - Example: `font-mono text-sm text-muted-foreground` — pulled from real example files, hidden on mobile
- **Prefix mapping**:
  - `@@#params.*` → chart-1 (brightest)
  - `@@function:*` → chart-2
  - `@@type:*` → chart-3
  - `@@=[...]` → chart-4
  - `@@#GL.*` → chart-5 (darkest)

### How It Works (`src/components/landing/how-it-works-section.tsx`)

- **Background**: `bg-muted`, `py-20`
- **Badge**: shadcn `Badge` variant="secondary" — "How It Works"
- **Heading**: `text-3xl font-bold text-foreground` — "A single recursive pass"
- **Flow**: flex row on desktop (with → arrows), flex col on mobile (with ↓ arrows)
- **Steps** (5 total): each is a shadcn `Card` (sm variant)
  - `CardHeader`: step label in `text-sm font-semibold`
  - `CardContent`: brief description in `text-muted-foreground text-sm`
  - Steps: "JSON Config" → "Params Resolution" → "JSONConverter" → "deck.gl / MapLibre" → "Rendered Map"
  - Middle step ("JSONConverter") gets `border-primary` to emphasize the core
- **Arrows**: `text-muted-foreground` using `→` / `↓` characters

### CTA (`src/components/landing/cta-section.tsx`)

- **Background**: `bg-background`, `py-20`
- **Layout**: centered flex column
- **Button**: shadcn `Button` default variant, `size="lg"` → Link to `/playground` — "Open the Playground"
- **Text**: `text-muted-foreground text-sm` — "Edit JSON. Tweak params. See it resolve live."

## Removed

- `src/components/landing/works-with-section.tsx` — deleted
- Import/usage removed from `src/routes/index.tsx`

## Locales

### Config change
- `project.inlang/settings.json`: `"locales": ["en", "de"]` → `"locales": ["en", "es"]`

### Message files
- Delete `messages/de.json`
- Create `messages/es.json` with Spanish translations of all 7 message keys

### Auto-generated
- Run `pnpm dev` to regenerate `src/paraglide/` with new locale set
- `LocaleSwitcher` auto-updates (reads from runtime `locales` array)

## File Change Summary

| File | Action |
|------|--------|
| `src/styles.css` | Remove legacy vars/classes, keep shadcn theme |
| `src/components/Header.tsx` | Full rewrite — minimal shadcn header |
| `src/components/Footer.tsx` | Full rewrite — shadcn styled, rebranded |
| `src/components/landing/hero-section.tsx` | Rewrite with shadcn components/palette |
| `src/components/landing/problem-section.tsx` | Rewrite with shadcn Card, real examples |
| `src/components/landing/prefix-family-section.tsx` | Rewrite with shadcn palette, real examples |
| `src/components/landing/how-it-works-section.tsx` | Rewrite with shadcn Card |
| `src/components/landing/cta-section.tsx` | Rewrite with shadcn Button |
| `src/components/landing/works-with-section.tsx` | Delete |
| `src/routes/index.tsx` | Remove works-with import |
| `project.inlang/settings.json` | de → es |
| `messages/de.json` | Delete |
| `messages/es.json` | Create (Spanish translations) |
| `src/routes/__root.tsx` | Update if header/footer imports change |

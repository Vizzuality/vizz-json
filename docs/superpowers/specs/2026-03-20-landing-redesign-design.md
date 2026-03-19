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
- **Code examples**: Import real JSON files from `src/examples/` and extract specific fields at build time.
- **Link pattern**: Use `<Link className={cn(buttonVariants({ variant, size }))}>` instead of `Button asChild`, since the base-nova Button (built on `@base-ui/react`) does not support `asChild`.

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
- Fraunces font import (only consumer `.display-title` is being deleted)
- Global `code` styles (use legacy vars). Keep `pre code` reset as defensive measure.

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

## Header

**File**: `src/components/Header.tsx` — full rewrite.

**Structure:**
```
<header> sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border
  <nav aria-label="Main navigation"> max-w-5xl mx-auto px-6 h-14 flex items-center
    <Link to="/"> brand mark
      <span> monospace "{ @@ }" text-primary font-mono text-sm
      <span> "Superpowers" text-foreground font-semibold
    </Link>
    <div> ml-auto flex items-center gap-1
      <Link to="/playground" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
        Playground
      </Link>
      <ThemeToggle />
      <LocaleSwitcher />
    </div>
  </nav>
</header>
```

**Behavior:**
- Sticky with semi-transparent background and blur
- No dropdown menus, no demo links, no social links

## ThemeToggle

**File**: `src/components/ThemeToggle.tsx` — restyle.

Current component uses legacy CSS variables (`var(--chip-line)`, `var(--chip-bg)`, `var(--sea-ink)`). Restyle using shadcn `Button` variant="ghost" size="icon-sm". Remove all inline styles referencing legacy vars. Icon color via `text-muted-foreground`.

## LocaleSwitcher

**File**: `src/components/LocaleSwitcher.tsx` — restyle.

Current component uses hardcoded hex colors and inline styles. Restyle using shadcn `Button` variant="ghost" size="sm" for each locale button. Active locale indicated with `text-foreground font-semibold`, inactive with `text-muted-foreground`. Remove all inline styles.

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

## Root Layout

**File**: `src/routes/__root.tsx` — minor updates.

- Replace hardcoded `selection:bg-[rgba(79,184,178,0.24)]` with `selection:bg-primary/20`
- Update header/footer imports if paths change

## About Page

**File**: `src/routes/about.tsx` — migrate.

Currently uses legacy classes (`page-wrap`, `island-shell`, `island-kicker`, `display-title`) and legacy CSS vars (`var(--sea-ink)`, `var(--sea-ink-soft)`). Migrate to shadcn palette: `max-w-5xl mx-auto px-6` for layout, `bg-card` / `border border-border rounded-lg` for card containers, `text-foreground` / `text-muted-foreground` for text.

## Landing Sections

All sections use `max-w-5xl mx-auto px-6` for content width. Sections alternate between `bg-background` and `bg-muted` for visual separation.

### Hero (`src/components/landing/hero-section.tsx`)

- **Background**: `bg-background`, `py-24 sm:py-32`
- **Badge**: shadcn `Badge` variant="secondary" — "Vizzuality — Frontend Team"
- **Heading**: `text-4xl sm:text-5xl font-bold text-foreground` with "Superpowers" in `text-primary`
- **Subheading**: `text-lg text-muted-foreground max-w-2xl`
- **CTA**: `<Link to="/playground" className={cn(buttonVariants({ size: 'lg' }))}>Try the Playground</Link>`
- **Layout**: centered flex column, `items-center text-center`

### Problem (`src/components/landing/problem-section.tsx`)

- **Background**: `bg-muted`, `py-20`
- **Badge**: shadcn `Badge` variant="secondary" — "The Problem"
- **Heading**: `text-3xl font-bold text-foreground`
- **Grid**: `grid grid-cols-1 md:grid-cols-2 gap-6`
- **Before card**: shadcn `Card` with `CardHeader` ("Before — Static JSON") and `CardContent` containing a code block. Left border accent `border-l-4 border-chart-5`.
- **After card**: shadcn `Card` with `CardHeader` ("After — Dynamic JSON") and `CardContent` containing a code block. Left border accent `border-l-4 border-chart-1`.
- **Code blocks**: `bg-muted rounded-md p-4 font-mono text-sm text-foreground overflow-x-auto`
- **Example extraction**: Import `src/examples/01-raster-opacity.json`. The "Before" card shows the `layers[0].props` object with `@@#params` values replaced by their resolved literals (e.g., `"opacity": 0.8`). The "After" card shows the same object with the `@@#params.opacity` reference intact. Extract and format these as `JSON.stringify` snippets at the component level.

### Prefix Family (`src/components/landing/prefix-family-section.tsx`)

- **Background**: `bg-background`, `py-20`
- **Badge**: shadcn `Badge` variant="secondary" — "The @@ Prefix Family"
- **Heading**: `text-3xl font-bold text-foreground` — "One convention, five capabilities"
- **Content**: 5 rows, each separated by shadcn `Separator`
- **Each row**: flex layout
  - Prefix in monospace: `font-mono font-semibold` colored with `text-chart-N`
  - Description: `text-muted-foreground`
  - Example: `font-mono text-sm text-muted-foreground` — extracted from real example files, hidden on mobile
- **Prefix → color → example source mapping**:
  - `@@#params.*` → chart-1 → `01-raster-opacity.json` → `"opacity": "@@#params.opacity"`
  - `@@function:*` → chart-2 → `07-raster-function.json` → `"@@function:setQueryParams"`
  - `@@type:*` → chart-3 → `08-deckgl-scatterplot.json` → `"@@type": "ScatterplotLayer"`
  - `@@=[...]` → chart-4 → `09-conditional-case.json` → `"@@=[case, ...]"`
  - `@@#GL.*` → chart-5 → `06-data-driven-circles.json` → `"@@#GL.POINTS"`

### How It Works (`src/components/landing/how-it-works-section.tsx`)

- **Background**: `bg-muted`, `py-20`
- **Badge**: shadcn `Badge` variant="secondary" — "How It Works"
- **Heading**: `text-3xl font-bold text-foreground` — "A single recursive pass"
- **Flow**: flex row on desktop (with → arrows), flex col on mobile (with ↓ arrows)
- **Steps** (5 total): each is a shadcn `Card` size="sm"
  - `CardHeader`: step label in `text-sm font-semibold`
  - `CardContent`: brief description in `text-muted-foreground text-sm`
  - Steps: "JSON Config" → "Params Resolution" → "JSONConverter" → "deck.gl / MapLibre" → "Rendered Map"
  - Step at index 2 ("JSONConverter") gets `border-primary` to emphasize the core engine
- **Arrows**: `text-muted-foreground` using `→` / `↓` characters

### CTA (`src/components/landing/cta-section.tsx`)

- **Background**: `bg-background`, `py-20`
- **Layout**: centered flex column
- **Button**: `<Link to="/playground" className={cn(buttonVariants({ size: 'lg' }))}>Open the Playground</Link>`
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
- Note: These message keys are TanStack-starter boilerplate used only in the i18n demo page. Landing page content is not internationalized.

### Auto-generated
- Run `pnpm dev` to regenerate `src/paraglide/` with new locale set
- `LocaleSwitcher` auto-updates (reads from runtime `locales` array)

## File Change Summary

| File | Action |
|------|--------|
| `src/styles.css` | Remove legacy vars/classes/fonts, keep shadcn theme |
| `src/components/Header.tsx` | Full rewrite — minimal shadcn header |
| `src/components/ThemeToggle.tsx` | Restyle — shadcn Button ghost, remove legacy vars |
| `src/components/LocaleSwitcher.tsx` | Restyle — shadcn Button ghost, remove inline styles |
| `src/components/Footer.tsx` | Full rewrite — shadcn styled, rebranded |
| `src/routes/__root.tsx` | Replace hardcoded selection color with `selection:bg-primary/20` |
| `src/routes/about.tsx` | Migrate from legacy classes to shadcn palette |
| `src/components/landing/hero-section.tsx` | Rewrite with shadcn components/palette |
| `src/components/landing/problem-section.tsx` | Rewrite with shadcn Card, import real examples |
| `src/components/landing/prefix-family-section.tsx` | Rewrite with shadcn palette, mapped examples |
| `src/components/landing/how-it-works-section.tsx` | Rewrite with shadcn Card |
| `src/components/landing/cta-section.tsx` | Rewrite with shadcn Button |
| `src/components/landing/works-with-section.tsx` | Delete |
| `src/routes/index.tsx` | Remove works-with import |
| `project.inlang/settings.json` | de → es |
| `messages/de.json` | Delete |
| `messages/es.json` | Create (Spanish translations) |

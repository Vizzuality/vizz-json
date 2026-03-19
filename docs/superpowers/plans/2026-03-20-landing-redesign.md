# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the landing page, header, footer, and utility components to use the shadcn/ui base-nova palette exclusively, remove all legacy CSS variables, and change locales from de/en to es/en.

**Architecture:** Strip legacy custom CSS variables and utility classes from `styles.css`, then rewrite each component using only shadcn/ui tokens (`bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-card`, `border`, `text-primary`, `text-chart-1` through `text-chart-5`). Use shadcn/ui primitives (`Card`, `Badge`, `Button`, `Separator`) throughout. Code examples in landing sections import from real `src/examples/*.json` files.

**Tech Stack:** React 19, TanStack Start, Tailwind CSS v4, shadcn/ui (base-nova, mauve), Paraglide i18n

**Spec:** `docs/superpowers/specs/2026-03-20-landing-redesign-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/styles.css` | Modify | Remove legacy vars/classes, keep shadcn theme |
| `src/routes/__root.tsx` | Modify | Fix hardcoded selection color |
| `src/components/ThemeToggle.tsx` | Modify | Restyle with shadcn tokens |
| `src/components/LocaleSwitcher.tsx` | Modify | Restyle with shadcn Button |
| `src/components/Header.tsx` | Rewrite | Minimal header with brand + playground + utilities |
| `src/components/Footer.tsx` | Rewrite | Rebranded footer with shadcn tokens |
| `src/routes/about.tsx` | Modify | Migrate from legacy classes to shadcn palette |
| `src/routes/index.tsx` | Modify | Remove works-with import |
| `src/components/landing/hero-section.tsx` | Rewrite | shadcn Badge + Button + theme tokens |
| `src/components/landing/problem-section.tsx` | Rewrite | shadcn Card + real example imports |
| `src/components/landing/prefix-family-section.tsx` | Rewrite | shadcn Separator + chart colors |
| `src/components/landing/how-it-works-section.tsx` | Rewrite | shadcn Card + theme tokens |
| `src/components/landing/cta-section.tsx` | Rewrite | shadcn Button + theme tokens |
| `src/components/landing/works-with-section.tsx` | Delete | Removed per spec |
| `project.inlang/settings.json` | Modify | de → es |
| `messages/de.json` | Delete | Replace with es |
| `messages/es.json` | Create | Spanish translations |

---

### Task 1: CSS Cleanup

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Remove legacy custom variables from `:root`**

Remove lines 15–33 from `:root` (everything between the shadcn oklch variables and the legacy vars). Keep only the shadcn theme variables (`--background` through `--sidebar-ring` and `--radius`).

Remove these variables:
```
--sea-ink, --sea-ink-soft, --lagoon, --lagoon-deep, --palm, --sand, --foam,
--surface, --surface-strong, --line, --inset-glint, --kicker, --bg-base,
--header-bg, --chip-bg, --chip-line, --link-bg-hover, --hero-a, --hero-b
```

- [ ] **Step 2: Remove legacy dark theme blocks**

Delete the entire `:root[data-theme="dark"]` block (lines 68–88).
Delete the entire `@media (prefers-color-scheme: dark)` block (lines 90–112).

- [ ] **Step 3: Remove legacy body and element styles**

Delete:
- The `body` rule (lines 125–137) with `color: var(--sea-ink)`, `background-color`, and `background` gradients
- `body::before` pseudo-element (lines 139–150)
- `body::after` pseudo-element (lines 152–164)
- The `a` color rules (lines 166–176)
- The `code` styling rule (lines 178–183) — uses `var(--line)` and `var(--surface-strong)`
- Keep `pre code` reset (lines 185–192) as defensive measure

- [ ] **Step 4: Remove legacy utility classes**

Delete all of these:
- `.page-wrap` (lines 194–197)
- `.display-title` (lines 199–201)
- `.island-shell` (lines 203–211)
- `.feature-card` and `.feature-card:hover` (lines 213–224)
- The transition rule on `button, .island-shell, a` (lines 226–229)
- `.island-kicker` (lines 231–239)
- `.nav-link` and all its states/pseudo-elements (lines 241–276)
- `.site-footer` (lines 278–281)
- `.rise-in` and its `@keyframes` (lines 283–296)

- [ ] **Step 5: Remove Fraunces font import**

In the Google Fonts import URL (line 1), remove the Fraunces portion. Change:
```css
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap");
```
To:
```css
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap");
```

- [ ] **Step 6: Grep for remaining legacy references**

```bash
grep -rn 'var(--sea-ink\|var(--lagoon\|var(--palm\|var(--sand\|var(--foam\|var(--surface\|var(--line)\|var(--inset-glint\|var(--kicker\|var(--bg-base\|var(--header-bg\|var(--chip-\|var(--link-bg-hover\|var(--hero-\|page-wrap\|island-shell\|island-kicker\|display-title\|nav-link\|site-footer' src/
```

Expected: no matches. If any are found, they must be fixed in subsequent tasks.

- [ ] **Step 7: Verify the resulting file**

The file should contain only:
1. Manrope font import + Tailwind/shadcn/fontsource imports
2. `@custom-variant dark` + `@plugin "@tailwindcss/typography"`
3. `@theme { --font-sans }` block
4. `:root` with only shadcn oklch variables
5. `* { box-sizing: border-box }` + `html, body, #app { min-height: 100% }`
6. `pre code` reset
7. `.dark` block
8. `@theme inline` block
9. `@layer base` block

**Note:** After this task is committed, the UI will be broken until Tasks 2-7 are completed. These tasks form one logical unit — do not deploy until all are done.

- [ ] **Step 7: Commit**

```bash
git add src/styles.css
git commit -m "refactor: remove legacy CSS variables and utility classes"
```

---

### Task 2: Root Layout Fix

**Files:**
- Modify: `src/routes/__root.tsx`

- [ ] **Step 1: Replace hardcoded selection color**

On line 70, change:
```tsx
<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
```
To:
```tsx
<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-primary/20">
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/__root.tsx
git commit -m "refactor: replace hardcoded selection color with shadcn token"
```

---

### Task 3: ThemeToggle Restyle

**Files:**
- Modify: `src/components/ThemeToggle.tsx`

- [ ] **Step 1: Import buttonVariants and use shadcn Button styling**

Add import at top of file:
```tsx
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'
```

Replace the `<button>` element's className (line 76):
```tsx
className="rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] shadow-[0_8px_22px_rgba(30,90,72,0.08)] transition hover:-translate-y-0.5"
```
With:
```tsx
className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ThemeToggle.tsx
git commit -m "refactor: restyle ThemeToggle with shadcn tokens"
```

---

### Task 4: LocaleSwitcher Restyle

**Files:**
- Modify: `src/components/LocaleSwitcher.tsx`

- [ ] **Step 1: Rewrite to use Tailwind classes instead of inline styles**

Replace the entire component body with:

```tsx
import { getLocale, locales, setLocale } from '#/paraglide/runtime'
import { m } from '#/paraglide/messages'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export default function ParaglideLocaleSwitcher() {
  const currentLocale = getLocale()

  return (
    <div
      className="flex items-center gap-2"
      aria-label={m.language_label()}
    >
      <span className="text-sm text-muted-foreground">
        {m.current_locale({ locale: currentLocale })}
      </span>
      <div className="flex gap-1">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => setLocale(locale)}
            aria-pressed={locale === currentLocale}
            className={cn(
              buttonVariants({
                variant: locale === currentLocale ? 'default' : 'ghost',
                size: 'sm',
              }),
            )}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/LocaleSwitcher.tsx
git commit -m "refactor: restyle LocaleSwitcher with shadcn tokens"
```

---

### Task 5: Header Rewrite

**Files:**
- Rewrite: `src/components/Header.tsx`

- [ ] **Step 1: Rewrite the entire Header component**

```tsx
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import ParaglideLocaleSwitcher from './LocaleSwitcher'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-14 max-w-5xl items-center px-6"
      >
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <span className="font-mono text-sm text-primary">{'{ @@ }'}</span>
          <span className="font-semibold text-foreground">Superpowers</span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/playground"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'no-underline',
            )}
          >
            Playground
          </Link>
          <ThemeToggle />
          <ParaglideLocaleSwitcher />
        </div>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: redesign header with minimal shadcn layout"
```

---

### Task 6: Footer Rewrite

**Files:**
- Rewrite: `src/components/Footer.tsx`

- [ ] **Step 1: Rewrite the entire Footer component**

```tsx
export default function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-center sm:flex-row sm:text-left">
        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">JSON with Superpowers</p>
          <p className="mt-1">Built by Vizzuality Frontend Team</p>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: redesign footer with shadcn tokens and new branding"
```

---

### Task 7: About Page Migration

**Files:**
- Modify: `src/routes/about.tsx`

- [ ] **Step 1: Replace legacy classes with shadcn tokens**

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section className="rounded-lg border border-border bg-card p-6 sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          About
        </p>
        <h1 className="mb-3 text-4xl font-bold text-foreground sm:text-5xl">
          A small starter with room to grow.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-muted-foreground">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/routes/about.tsx
git commit -m "refactor: migrate about page from legacy CSS to shadcn tokens"
```

---

### Task 8: Landing — Hero Section

**Files:**
- Rewrite: `src/components/landing/hero-section.tsx`

- [ ] **Step 1: Rewrite with shadcn Badge + theme tokens**

```tsx
import { Link } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export function HeroSection() {
  return (
    <section className="w-full bg-background py-24 sm:py-32">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
        <Badge variant="secondary" className="mb-4">
          Vizzuality — Frontend Team
        </Badge>
        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          JSON with <span className="text-primary">Superpowers</span>
        </h1>
        <p className="mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          The <code className="font-mono text-primary">@@</code> convention for
          turning static JSON into dynamic, parameterized configurations —
          library-agnostic, CMS-ready, runtime-resolved.
        </p>
        <Link
          to="/playground"
          className={cn(buttonVariants({ size: 'lg' }), 'no-underline')}
        >
          Try the Playground
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/hero-section.tsx
git commit -m "feat: restyle hero section with shadcn palette"
```

---

### Task 9: Landing — Problem Section

**Files:**
- Rewrite: `src/components/landing/problem-section.tsx`

- [ ] **Step 1: Rewrite with shadcn Card + real example import**

```tsx
import { Badge } from '#/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import rasterOpacity from '#/examples/01-raster-opacity.json'

const beforeSnippet = JSON.stringify(
  {
    type: 'raster',
    paint: {
      'raster-opacity': rasterOpacity.params_config[0].default,
    },
    layout: {
      visibility: rasterOpacity.params_config[1].default,
    },
  },
  null,
  2,
)

const afterSnippet = JSON.stringify(
  rasterOpacity.config.styles[0],
  null,
  2,
)

export function ProblemSection() {
  return (
    <section className="w-full bg-muted py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          The Problem
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          Static configs don&apos;t scale.
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-l-4 border-l-chart-5">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider">
                Before — Static JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm text-foreground leading-relaxed">
                <code>{beforeSnippet}</code>
              </pre>
              <p className="mt-4 text-xs text-muted-foreground">
                Hardcoded. Need a new API endpoint for every variation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-1">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider">
                After — Dynamic JSON
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm text-foreground leading-relaxed">
                <code>{afterSnippet}</code>
              </pre>
              <p className="mt-4 text-xs text-muted-foreground">
                One config, infinite variations. Resolved at runtime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/problem-section.tsx
git commit -m "feat: restyle problem section with shadcn Card and real examples"
```

---

### Task 10: Landing — Prefix Family Section

**Files:**
- Rewrite: `src/components/landing/prefix-family-section.tsx`

- [ ] **Step 1: Rewrite with chart colors and real example references**

```tsx
import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'

const PREFIXES = [
  {
    prefix: '@@#params.X',
    description: 'Runtime parameter injection',
    example: '"raster-opacity": "@@#params.opacity"',
    colorClass: 'text-chart-1',
  },
  {
    prefix: '@@function:',
    description: 'Named function dispatch',
    example: '"@@function:setQueryParams"',
    colorClass: 'text-chart-2',
  },
  {
    prefix: '@@type:',
    description: 'Class or React component instantiation',
    example: '"@@type": "ScatterplotLayer"',
    colorClass: 'text-chart-3',
  },
  {
    prefix: '@@=[...]',
    description: 'Inline expression → function',
    example: '"@@=[case, [">", ...], ...]"',
    colorClass: 'text-chart-4',
  },
  {
    prefix: '@@#ENUM.X',
    description: 'Constant/enum resolution',
    example: '"@@#GL.POINTS"',
    colorClass: 'text-chart-5',
  },
] as const

export function PrefixFamilySection() {
  return (
    <section className="w-full bg-background py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          The @@ Prefix Family
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          One convention, five capabilities.
        </h2>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {PREFIXES.map((row, index) => (
            <div key={row.prefix}>
              <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-6 py-4">
                <code
                  className={`whitespace-nowrap font-mono text-sm font-semibold ${row.colorClass}`}
                >
                  {row.prefix}
                </code>
                <span className="text-sm text-muted-foreground">
                  {row.description}
                </span>
                <code className="hidden whitespace-nowrap text-right font-mono text-xs text-muted-foreground sm:block">
                  {row.example}
                </code>
              </div>
              {index < PREFIXES.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/prefix-family-section.tsx
git commit -m "feat: restyle prefix family section with chart colors"
```

---

### Task 11: Landing — How It Works Section

**Files:**
- Rewrite: `src/components/landing/how-it-works-section.tsx`

- [ ] **Step 1: Rewrite with shadcn Card**

```tsx
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'

const STEPS = [
  { label: 'JSON Config', sublabel: 'From CMS or API' },
  { label: 'Params Resolution', sublabel: '@@#params.* → values' },
  { label: 'JSONConverter', sublabel: 'Recursive resolve', emphasized: true },
  { label: 'deck.gl / MapLibre', sublabel: 'Native JS objects' },
  { label: 'Rendered Map', sublabel: 'Live visualization' },
]

export function HowItWorksSection() {
  return (
    <section className="w-full bg-muted py-20">
      <div className="mx-auto max-w-5xl px-6">
        <Badge variant="secondary" className="mb-3">
          How It Works
        </Badge>
        <h2 className="mb-12 text-3xl font-bold text-foreground">
          A single recursive pass.
        </h2>

        {/* Desktop: horizontal flow */}
        <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
          {STEPS.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2">
              <Card
                size="sm"
                className={`min-w-[130px] text-center ${
                  step.emphasized ? 'border-primary' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{step.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {step.sublabel}
                  </p>
                </CardContent>
              </Card>
              {index < STEPS.length - 1 && (
                <span className="text-lg font-light text-muted-foreground">
                  →
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical flow */}
        <div className="flex flex-col items-center gap-2 sm:hidden">
          {STEPS.map((step, index) => (
            <div
              key={step.label}
              className="flex w-full max-w-xs flex-col items-center gap-2"
            >
              <Card
                size="sm"
                className={`w-full text-center ${
                  step.emphasized ? 'border-primary' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="text-sm">{step.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {step.sublabel}
                  </p>
                </CardContent>
              </Card>
              {index < STEPS.length - 1 && (
                <span className="text-lg font-light text-muted-foreground">
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/how-it-works-section.tsx
git commit -m "feat: restyle how-it-works section with shadcn Card"
```

---

### Task 12: Landing — CTA Section

**Files:**
- Rewrite: `src/components/landing/cta-section.tsx`

- [ ] **Step 1: Rewrite with shadcn tokens**

```tsx
import { Link } from '@tanstack/react-router'
import { buttonVariants } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export function CtaSection() {
  return (
    <section className="w-full bg-background py-20">
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
        <Link
          to="/playground"
          className={cn(buttonVariants({ size: 'lg' }), 'no-underline')}
        >
          Open the Playground
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Edit JSON. Tweak params. See it resolve live.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/landing/cta-section.tsx
git commit -m "feat: restyle CTA section with shadcn tokens"
```

---

### Task 13: Landing — Remove Works With + Update Index

**Files:**
- Delete: `src/components/landing/works-with-section.tsx`
- Modify: `src/routes/index.tsx`

- [ ] **Step 1: Update index.tsx to remove WorksWithSection import and usage**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { HeroSection } from '#/components/landing/hero-section'
import { ProblemSection } from '#/components/landing/problem-section'
import { PrefixFamilySection } from '#/components/landing/prefix-family-section'
import { HowItWorksSection } from '#/components/landing/how-it-works-section'
import { CtaSection } from '#/components/landing/cta-section'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <ProblemSection />
      <PrefixFamilySection />
      <HowItWorksSection />
      <CtaSection />
    </main>
  )
}
```

- [ ] **Step 2: Delete works-with-section.tsx**

```bash
rm src/components/landing/works-with-section.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/routes/index.tsx src/components/landing/works-with-section.tsx
git commit -m "feat: remove Works With section from landing page"
```

---

### Task 14: Locale Change — de to es

**Files:**
- Modify: `project.inlang/settings.json`
- Delete: `messages/de.json`
- Create: `messages/es.json`

- [ ] **Step 1: Update inlang settings**

In `project.inlang/settings.json`, change:
```json
"locales": ["en", "de"]
```
To:
```json
"locales": ["en", "es"]
```

- [ ] **Step 2: Create Spanish translations**

Create `messages/es.json`:
```json
{
  "$schema": "https://inlang.com/schema/inlang-message-format",
  "home_page": "Página de inicio",
  "about_page": "Acerca de",
  "example_message": "Bienvenido a tu app con i18n.",
  "language_label": "Idioma",
  "current_locale": "Idioma actual: {locale}",
  "learn_router": "Aprender Paraglide JS"
}
```

- [ ] **Step 3: Delete German translations**

```bash
rm messages/de.json
```

- [ ] **Step 4: Commit**

```bash
git add project.inlang/settings.json messages/es.json messages/de.json
git commit -m "chore: change locale from de to es (German → Spanish)"
```

---

### Task 15: Build Verification

- [ ] **Step 1: Run dev server to regenerate Paraglide files**

```bash
pnpm dev
```

Wait for the server to start. Paraglide will regenerate `src/paraglide/` with the new `es` locale. Then stop the server (Ctrl+C).

- [ ] **Step 2: Run lint and type check**

```bash
pnpm lint
```

Fix any lint errors found.

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

All tests should pass. The converter tests don't depend on landing page components.

- [ ] **Step 4: Run production build**

```bash
pnpm build
```

Expected: clean build with no errors.

- [ ] **Step 5: Commit any generated file changes**

```bash
git add src/paraglide/
git commit -m "chore: regenerate paraglide files for es locale"
```

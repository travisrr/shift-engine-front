# Shift Engine Design System

A compact, professional design system optimized for restaurant management workflows.

---

## 1. Design Philosophy

### Core Principles

1. **Density without clutter** - Information-dense interfaces like Linear, not sparse like consumer apps
2. **Efficiency first** - Users are busy managers; every interaction should be fast and obvious
3. **Professional restraint** - No unnecessary decoration, gradients, or shadows
4. **Consistent rhythm** - Predictable spacing and sizing across all components

### Visual Identity

Shift Engine is a **professional B2B tool**, not a consumer app. The design should feel:
- Precise and reliable (like a well-run kitchen)
- Fast and responsive (no lag, ever)
- Trustworthy and established (not trendy or playful)

---

## 2. Color Palette

### Brand Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-shift-green` | `#3A4F39` | Primary brand, buttons, headers |
| `--color-shift-green-accent` | `#5C7A53` | Hover states, highlights |
| `--color-shift-brown` | `#8C6239` | Secondary actions, accents |
| `--color-shift-brown-hover` | `#704b2b` | Brown hover state |
| `--color-shift-offwhite` | `#FAF8F5` | Page backgrounds |
| `--color-shift-text-dark` | `#2C2C2C` | Primary text |
| `--color-shift-text-light` | `#666666` | Secondary/muted text |
| `--color-shift-border` | `#EAEAEA` | Borders, dividers |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-kpi-good` | `#2E7D32` | Positive metrics, success |
| `--color-kpi-bad` | `#C62828` | Negative metrics, errors |

### Neutral Scale (Tailwind defaults)

Use Tailwind's `gray` scale for UI chrome:
- `gray-50` - Subtle backgrounds
- `gray-100` - Hover states, zebra striping
- `gray-200` - Borders, dividers
- `gray-400` - Muted icons, placeholder text
- `gray-600` - Secondary text
- `gray-900` - Primary text

---

## 3. Typography

### Font Family

```css
font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
```

Inter is used for all UI text. It should always be rendered with:
- `-webkit-font-smoothing: antialiased`
- `-moz-osx-font-smoothing: grayscale`

### Type Scale

| Size | Usage | Line Height |
|------|-------|-------------|
| `text-[10px]` | Captions, timestamps, metadata | 1.3 |
| `text-[11px]` | Sub-labels, secondary info | 1.4 |
| `text-[12px]` | Compact UI labels | 1.4 |
| `text-[13px]` | **Primary UI text** | 1.5 |
| `text-sm` (14px) | Body text, descriptions | 1.5 |
| `text-base` (16px) | Emphasized body | 1.5 |
| `text-lg` (18px) | Section headers | 1.4 |
| `text-xl` (20px+) | Page titles | 1.3 |

### Font Weights

- `font-normal` (400) - Body text
- `font-medium` (500) - **Primary UI text, labels, nav items**
- `font-semibold` (600) - Section headers, emphasized data
- `font-bold` (700) - Page titles, critical numbers

---

## 4. Spacing & Layout

### Compact Density (Sidebar & Tables)

For information-dense areas like the sidebar and data tables:

| Element | Spacing |
|---------|---------|
| Container padding | `px-2` (8px) |
| Item vertical padding | `py-1.5` (6px) |
| Item horizontal padding | `px-2` (8px) |
| Gap between icon and text | `gap-2` (8px) |
| Gap between items | `space-y-px` or `gap-px` |
| Section spacing | `pt-2` (8px) |
| Border radius | `rounded-md` (6px) |

### Standard Density (Forms & Content)

For forms, modals, and content areas:

| Element | Spacing |
|---------|---------|
| Container padding | `p-4` (16px) |
| Input padding | `px-3 py-2` |
| Gap between fields | `space-y-3` or `gap-3` |
| Section spacing | `mb-4` |

### Header Heights

| Context | Height |
|---------|--------|
| Sidebar header | `h-11` (44px) |
| Top navigation | `h-14` (56px) |
| Table header | `h-9` (36px) |

---

## 5. Component Patterns

### Buttons

**Primary Button**
```
bg-[#3A4F39] hover:bg-[#2d3e2c] text-white
rounded-md px-3 py-1.5
font-medium text-[13px]
transition-colors duration-150
```

**Secondary Button**
```
bg-white border border-gray-200 hover:bg-gray-50 text-gray-700
rounded-md px-3 py-1.5
font-medium text-[13px]
transition-colors duration-150
```

**Ghost Button**
```
hover:bg-zinc-50 text-gray-600
rounded-md px-2 py-1.5
font-medium text-[13px]
transition-colors duration-150
```

### Navigation Items

**Active State**
```
bg-zinc-100 text-black
rounded-md px-2 py-1.5
text-[13px] font-medium
```

**Inactive State**
```
text-gray-600 hover:bg-zinc-50 hover:text-gray-900
rounded-md px-2 py-1.5
text-[13px] font-medium
```

**Icon Styling**
```
h-4 w-4 shrink-0
text-gray-400 (inactive) / text-black (active)
strokeWidth: active ? 2 : 1.75
```

### Inputs

```
border border-gray-200 rounded-md
px-3 py-2
text-[13px]
focus:border-[#3A4F39] focus:ring-2 focus:ring-[#3A4F39]/10
hover:border-gray-300
transition-all duration-150
```

### Cards

```
bg-white rounded-lg border border-gray-200
shadow-sm (optional, use sparingly)
```

---

## 6. Sidebar Guidelines (Linear-Inspired)

The sidebar is the primary navigation. It should feel **compact, fast, and scannable**.

### Dimensions

- Width: `w-60` (240px) - fixed
- Header height: `h-11` (44px)
- Collapsed width: `w-16` (64px) - when implemented

### Item Spacing

```
Parent items:
- px-2 py-1.5
- gap-2 between icon and text
- space-y-px between items

Child items (nested):
- ml-3 pl-2 (indented with border-left)
- Same padding as parent
- Subtle text color: text-gray-500
```

### Expand/Collapse

- Chevron: `h-3 w-3`
- Rotation: `90deg` when expanded
- Animation: `duration-200`
- Border-left on child container: `border-gray-200`

### Avatar/User Section

```
Avatar: h-6 w-6
Text container: min-w-0 (for truncation)
Name: text-[12px] font-medium
Email: text-[10px] text-gray-400
Chevron: h-3 w-3
```

---

## 7. Animations & Motion

### Principles

1. **Subtle, never flashy** - Animations aid understanding, not decoration
2. **Fast** - Most transitions should be `150-200ms`
3. **Performance-conscious** - Use `transform` and `opacity` only

### Standard Durations

| Context | Duration |
|---------|----------|
| Hover state changes | `150ms` |
| Toggle/collapse | `200ms` |
| Page transitions | `200-300ms` |
| Complex animations | `300-400ms` |

### Standard Easing

- `ease-out` - For elements entering/appearing
- `ease-in-out` - For toggles and bidirectional animations
- `linear` - For continuous animations (loading, progress)

### Common Patterns

```css
/* Hover transitions */
transition-colors duration-150

/* Expand/collapse */
transition-transform duration-200 ease-in-out

/* Opacity fades */
transition-opacity duration-150

/* All properties */
transition-all duration-200
```

---

## 8. Iconography

### Icon Library

Use **Lucide React** exclusively.

### Icon Sizing

| Context | Size |
|---------|------|
| Sidebar navigation | `h-4 w-4` |
| Buttons | `h-4 w-4` |
| Table actions | `h-3.5 w-3.5` |
| Chevron indicators | `h-3 w-3` |
| Large decorative | `h-5 w-5` or larger |

### Stroke Width

- Default: `strokeWidth={1.75}`
- Active/highlighted: `strokeWidth={2}`

### Color

- Inactive: `text-gray-400`
- Hover: `text-gray-500` or `text-gray-600`
- Active: `text-black` or `text-[#3A4F39]`
- Muted: `text-gray-300`

---

## 9. Tables & Data

### Row Height

Compact tables: `h-9` (36px) per row

### Cell Padding

```
px-3 py-2 (standard)
px-2 py-1.5 (compact)
```

### Borders

- Header: `border-b border-gray-200`
- Row dividers: `border-b border-gray-100`
- No vertical borders by default

### Zebra Striping (Optional)

```
even:bg-gray-50
```

---

## 10. Do's and Don'ts

### DO

- Use compact spacing for navigation and tables
- Keep text at `text-[13px]` for most UI elements
- Use `font-medium` for labels and navigation
- Apply `antialiased` font smoothing
- Use subtle hover states (`bg-zinc-50`, `bg-gray-50`)
- Keep animations under 200ms for UI feedback
- Use `gap-2` (8px) for icon + text spacing
- Truncate long text with `truncate` or `min-w-0`

### DON'T

- Use large padding (`p-4`, `gap-4`) in dense UI areas
- Mix multiple font sizes in the same component
- Use heavy shadows or borders
- Add decorative gradients without purpose
- Use animations over 300ms for UI feedback
- Mix icon libraries (Lucide only)
- Use `text-sm` (14px) for sidebar items
- Forget `shrink-0` on icons

---

## 11. Responsive Breakpoints

| Breakpoint | Usage |
|------------|-------|
| `sm` (640px) | Minor adjustments |
| `md` (768px) | Tablet layouts |
| `lg` (1024px) | **Dashboard sidebar appears** |
| `xl` (1280px) | Full desktop layouts |

### Sidebar Behavior

- Mobile (< `lg`): Hidden by default, slide-out menu
- Desktop (≥ `lg`): Fixed `w-60` sidebar visible

---

## 12. File Upload / Dropzone

### Compact Dropzone (Sidebar)

```
border border-dashed border-gray-300 rounded-md
px-2 py-2
text-[11px] font-medium
Icon container: h-7 w-7 with bg-zinc-100
Icon: h-3.5 w-3.5
Hover: hover:border-gray-400 hover:bg-zinc-100/60
Active drag: border-indigo-400 bg-indigo-50/60
```

---

## Quick Reference Card

```
SPACING SCALE FOR DENSE UI:
┌─────────────┬───────────┐
│ Container   │ px-2      │
│ Item Y      │ py-1.5    │
│ Item X      │ px-2      │
│ Icon gap    │ gap-2     │
│ Item gap    │ space-y-px│
│ Section     │ pt-2      │
└─────────────┴───────────┘

TEXT SCALE:
┌─────────────┬────────────────┐
│ 10px        │ Captions       │
│ 11px        │ Sub-labels     │
│ 12px        │ Compact labels │
│ 13px        │ UI text (main) │
│ 14px        │ Body text      │
└─────────────┴────────────────┘

DURATION SCALE:
┌─────────────┬───────────┐
│ 150ms       │ Hover     │
│ 200ms       │ Toggle    │
│ 300ms       │ Complex   │
└─────────────┴───────────┘
```

# Kaching Bundles — Competitive Analysis

> Based on hands-on exploration of the Kaching Bundles Shopify app installed on
> `bundlifydev` store, February 2026.

---

## Table of Contents

1. [Overview & Navigation](#1-overview--navigation)
2. [Bundle Types](#2-bundle-types)
3. [Deal Builder — Settings Tab](#3-deal-builder--settings-tab)
4. [Deal Builder — Variants & Swatches](#4-deal-builder--variants--swatches)
5. [Deal Builder — Pricing](#5-deal-builder--pricing)
6. [Deal Builder — Cart Behavior](#6-deal-builder--cart-behavior)
7. [Deal Builder — Feature Toggles](#7-deal-builder--feature-toggles)
8. [Design & Theming — Style Section](#8-design--theming--style-section)
9. [Design & Theming — Colors](#9-design--theming--colors)
10. [Design & Theming — Typography](#10-design--theming--typography)
11. [Design & Theming — Custom CSS](#11-design--theming--custom-css)
12. [Countdown Timer](#12-countdown-timer)
13. [Checkout Upsells](#13-checkout-upsells)
14. [Progressive Gifts](#14-progressive-gifts)
15. [Sticky Add to Cart](#15-sticky-add-to-cart)
16. [Volume Discount Bundle](#16-volume-discount-bundle)
17. [Cart Drawer](#17-cart-drawer)
18. [Bar System (Multi-Tier Bundles)](#18-bar-system-multi-tier-bundles)
19. [A/B Testing](#19-ab-testing)
20. [Sidebar Navigation (Global Pages)](#20-sidebar-navigation-global-pages)
21. [Live Preview Panel](#21-live-preview-panel)
22. [Gap Analysis vs Bundlify](#22-gap-analysis-vs-bundlify)

---

## 1. Overview & Navigation

**Sidebar navigation** (within the Kaching app):
- Dashboard (home)
- More Upsells
- Translations
- Analytics
- Plans
- Settings
- Suggest Feature

**Dashboard** displays:
- Revenue summary card
- Bundle deals table with columns:
  - Deal name
  - Visitors
  - CR (Conversion Rate)
  - Bundles sold
  - AOV
  - Added revenue
  - Total revenue
  - Revenue per visitor
  - Profit per visitor
- "Create bundle deal" primary action button
- A/B test archive tab

---

## 2. Bundle Types

When clicking "Create bundle deal", Kaching presents **12 discount/bundle types**:

| # | Type | Description |
|---|------|-------------|
| 1 | **Single** | Single product bundle |
| 2 | **Duo** | Two products bundled together |
| 3 | **3-pack** | Three products bundled |
| 4 | **4-pack** | Four products bundled |
| 5 | **Quantity breaks (same product)** | Tiered pricing for same product |
| 6 | **Buy X get Y (BOXY)** | Buy one, get another free/discounted |
| 7 | **Quantity breaks (different products)** | Volume tiers across different products |
| 8 | **The Collection** | Bundle from a collection |
| 9 | **Complete the bundle** | Cross-sell to complete a set |
| 10 | **Subscribe & Save** | Subscription-based bundle discount |
| 11 | **Unlock Free gifts** | Spend threshold to unlock gifts |
| 12 | **Color themes** | Pre-set color theme dots shown at type selection |

Each type is represented by a visual card with an icon. Color theme dots (small circles in various brand colors) appear at the bottom of the type selector, allowing merchants to quickly apply a color palette.

---

## 3. Deal Builder — Settings Tab

Each deal has a **Settings** tab and a **Style** (Design) tab. The Settings tab contains:

### Basic Info
- **Name** — internal deal name
- **Block title** — customer-facing title shown on widget
- **Discount name** — label for the discount line item

### Visibility / Targeting
- **All products** (default)
- **All except selected products**
- **Specific selected products** (opens product selector modal)
- **Products in selected collections**
- **Markets** — dropdown (default "All")
- **Exclude B2B customers** — checkbox
- **Apply discount only via bundle widget** — checkbox (prevents discount code stacking)

### Scheduling
- **Active dates** — Start date, Start time (EST timezone shown)

### "Edit translations" link at top right — per-deal translation override

---

## 4. Deal Builder — Variants & Swatches

### Variant Options
- **Let customers choose different variants** — toggle
- **Show variant selection** — toggle
- **Hide theme variant picker** — checkbox (hides the theme's default variant selector when bundle is active)

### Swatch Picker Modal
"Add swatches to variant picker" dialog with:

**Option field** — dropdown: Denominations, Title, Color

**Type field** — dropdown with **7 swatch types**:
1. Default dropdown
2. Color swatch dropdown
3. Image swatch dropdown
4. Product image dropdown
5. Color swatch (inline)
6. Image swatch (inline)
7. Product image swatch (inline)

**Settings:**
- **Swatch size** — slider (px)
- **Swatch shape** — dropdown: Circle, Rounded, Square

### Default Variants
- **Set default variants** button — opens modal to pre-select which variant is chosen by default per bar/tier

---

## 5. Deal Builder — Pricing

- **Show prices per item** — checkbox
- **Use product compare-at price** — checkbox (uses strikethrough original price)
- **Show prices without decimals** — checkbox
- **Price rounding** — checkbox
- **Update theme product price** — checkbox with sub-option:
  - Price per item
  - Bundle price

---

## 6. Deal Builder — Cart Behavior

- **Skip cart and go to checkout directly** — checkbox
- **Low stock alert** — toggle (shows urgency when stock is low)

---

## 7. Deal Builder — Feature Toggles

The deal builder has **7 collapsible feature sections**, each with a toggle:

| Feature | Toggle | Description |
|---------|--------|-------------|
| **Style** | Always on | Layout, colors, typography, custom CSS |
| **Volume discount bundle with other products** | On/Off | Cross-product volume discounting |
| **Countdown timer** | On/Off | Urgency timer on the bundle widget |
| **Subscriptions** | On/Off | Recurring purchase option |
| **Checkbox upsells** | On/Off | Add-on products via checkboxes |
| **Progressive gifts** | On/Off | Tiered free gift unlocking |
| **Sticky add to cart** | On/Off | Fixed bottom bar with bundle CTA |

---

## 8. Design & Theming — Style Section

### Layout
- **4 visual layout presets** — shown as thumbnail cards:
  - Vertical card layout
  - Horizontal card layout
  - Compact list layout
  - Minimal layout
- Click to select; active layout is highlighted

### Spacing & Shape
- **Corner radius** — slider (px value displayed)
- **Spacing** — slider (px value displayed)

---

## 9. Design & Theming — Colors

Kaching provides **granular color pickers** organized by element group. Each color has a clickable swatch that opens a color picker.

### General Colors (4)
| Control | Description |
|---------|-------------|
| Cards background | Background color of bundle cards |
| Selected background | Background when a tier/bar is selected |
| Border color | Card border color |
| Block title | Color of the main bundle block title |

### Bar Text Colors (4)
| Control | Description |
|---------|-------------|
| Title | Bar/tier title text color |
| Subtitle | Bar/tier subtitle text color |
| Price | Active price text color |
| Full price | Strikethrough original price color |

### Label Colors (2)
| Control | Description |
|---------|-------------|
| Background | Label/tag background |
| Text | Label/tag text color |

### Badge Colors (2)
| Control | Description |
|---------|-------------|
| Background | "Most Popular" / "Save X%" badge background |
| Text | Badge text color |

### Free Gift Colors (4)
| Control | Description |
|---------|-------------|
| Background | Free gift card background |
| Text | Free gift card text |
| Selected background | Free gift selected state background |
| Selected text | Free gift selected state text |

### Upsell Colors (4)
| Control | Description |
|---------|-------------|
| Background | Upsell card background |
| Text | Upsell card text |
| Selected background | Upsell selected state background |
| Selected text | Upsell selected state text |

**Total: 20 color controls** across 6 element groups.

---

## 10. Design & Theming — Typography

Kaching offers **per-element typography controls** — each element has independent font size and font style:

| Element | Font Size | Font Style Options |
|---------|-----------|-------------------|
| Block title | `px` input | Bold / Regular |
| Title | `px` input | Bold / Regular |
| Subtitle | `px` input | Regular / Bold |
| Label | `px` input | Regular / Bold |
| Free gift | `px` input | Bold / Regular |
| Upsell | `px` input | Bold / Regular |
| Unit label | `px` input | Regular / Bold |

**Total: 7 font size controls + 7 font style controls = 14 typography controls**

---

## 11. Design & Theming — Custom CSS

- **Custom Styles toggle** — enables/disables custom CSS
- **Scope tabs**: "All deals" / "This deal" — CSS can be global or per-deal
- **CSS editor** — line-numbered code editor (monospace font)
- Appears to support arbitrary CSS targeting bundle widget classes

---

## 12. Countdown Timer

When toggled on:
- **Fixed duration** — radio option with minutes input (e.g., 15 min)
- **Ends at midnight (user's local time)** — radio option with info tooltip
- **Custom end date** — radio option

### Timer Title Bar
- **Title** text input with emoji support — e.g., `Hurry! Offer expires in {{timer}}`
- **AI suggestion** button — generates title copy automatically
- **Background color** picker
- **Text color** picker (with size selector)
- **Alignment** — 4 options (left, center, right, justified)
- **Style** — Bold / Italic toggles
- **Size** — px input (e.g., 13px)

---

## 13. Checkout Upsells

"Checkbox upsells" section with:
- **Upsell #1** (expandable, reorderable with arrows)
  - **Selected product** / **Complementary product** — radio options
  - **"Select a product"** button — opens product picker modal
  - **Price** — dropdown (Percentage off, Fixed amount, Free) + discount amount (e.g., 20%)
  - **Discount per item** — percentage input
  - **Title** — text with dynamic variables `{{product}}`
  - **Subtitle** — text with variables `Save {{saved_amount}}!`
  - **Selected by default** — checkbox
  - **Match quantity with deal bar** — checkbox
  - **Sell as subscription** — checkbox
- **"Add upsell"** button to add more upsells (supports multiple)

Multiple upsells are shown stacked (Upsell #1, Upsell #2, etc.) each with full configuration. In the preview panel, upsell items appear as checkbox line items with prices (e.g., "Save $3.00 → $0.00").

---

## 14. Progressive Gifts

When toggled on:

### Layout
- **Settings** / **Style** tabs
- **2 layout options** — visual thumbnails (vertical vs horizontal card)

### Gift Configuration
- **Title** — e.g., "Free gifts with your order"
- **Subtitle** — e.g., "Unlock selecting a higher bundle"
- **Hide gifts until it's unlocked** — checkbox
- **Show labels for locked gifts** — checkbox

### Gift #1 (expandable)
- **Gift types**: Free gift / Free shipping (radio)
- **Image** — with "Edit image" button and size control
- **Discount badge**: "We automatically apply a 100% discount to gifts"
- **Unlock at quantity** — number input
- **Unlock at** — dropdown (e.g., "Bar #1 and higher")
- **Label** — text with dynamic tag `{{original_price}}`
- **Label crossed out** — text with dynamic tag
- **Title** — text with dynamic tag `{{product}}`
- **Locked title** — text (shown when gift is still locked): "Locked"

### Style Sub-tab
- Separate design controls for the progressive gifts section

---

## 15. Sticky Add to Cart

Expandable section with:

### Content Tab
- **Title** — text with dynamic variable `{{product}}`
- **Button** — text (e.g., "Choose bundle")

### Style Tab
- **Colors** (4 controls):
  - Background
  - Title (text color)
  - Button (background)
  - Button text
- **Typography** (4 controls):
  - Title: Font size (px) + Font style (Regular/Bold)
  - Button: Font size (px) + Font style (Regular/Bold)
- **Other** (4 controls):
  - Product photo size — slider (px, e.g., 40px)
  - Button padding — slider (px, e.g., 15px)
  - Product photo corner radius — slider (px)
  - Button corner radius — slider (px, e.g., 8px)

---

## 16. Volume Discount Bundle

"Volume discount bundle with other products" section:

- **Eligible for bundling** — product selection options
- **Layout** with:
  - **Button text** — customizable
  - **Color** picker for the button
- **Image** — with size control and editor
- **Other settings**:
  - Show product name — checkbox
  - Show price of chosen products only — checkbox
  - Auto-fill not chosen items — checkbox
  - Require item selection — checkbox
  - Customize "Choose product" modal — option

---

## 17. Cart Drawer

Kaching promotes a **customizable cart drawer** feature (shown as a promo banner at the bottom of the deal builder):

> "Display bundles in customizable cart drawer"
> Combine your bundles with urgency timer, free shipping bar, upsell carousels, etc. in a best converting cart drawer.

The cart drawer preview shows:
- **Shipping progress bar** — "Free shipping unlocked!" / "Add $12.00 to unlock 10% discount"
- **Urgency timer** — "Your cart will expire in 09:58"
- **Discount tiers** — Free shipping, 10% discount, Free gift (as progress milestones)
- **Main product** with variant selectors
- **Upsell products** in the cart with "Choose" buttons
- **Install button** — separate installation step

---

## 18. Bar System (Multi-Tier Bundles)

Kaching uses a **"Bar" system** for multi-tier bundles. Each bar represents a tier level:

- **Bar #1 - Single** (expandable, reorderable with drag handles)
- **Bar #2 - Duo** (expandable, reorderable)

Each bar can be independently configured and reordered using up/down arrows and drag handles. Bars can be duplicated or deleted via icon buttons.

### Add Bar Menu
The **"Add bar"** button shows a dropdown with bar type options:
- Quantity break
- Buy X, get Y
- Bundle upsell
- Subscription
- Other product

This allows mixing different discount mechanics within a single bundle deal.

---

## 19. A/B Testing

- **"Run A/B test"** button in the top-right of the deal builder (next to Preview)
- **A/B test archive** tab on the Dashboard
- Accessible from any deal — allows creating test variants of bundle configurations

---

## 20. Sidebar Navigation (Global Pages)

Beyond the deal builder, Kaching has these global pages (captured via automated screenshots):

### Settings Page
- Global app configuration (not captured in detail — the auto-explorer captured 4 scroll positions)

### More Upsells Page
- Additional upsell configuration beyond deal-specific upsells (3 scroll positions captured)

### Translations Page
- Multi-language support for all widget text (2 scroll positions captured)

### Analytics Page
- Revenue, conversion, and bundle performance metrics (2 scroll positions captured)

### Plans Page
- Pricing tiers for the app (3 scroll positions captured — top/mid/bottom)

---

## 21. Live Preview Panel

Every deal builder page includes a **right-side live preview panel** that updates in real-time:

- **Product previewing** — dropdown to select which product to preview with
- **Country previewing** — dropdown (e.g., Canada) for market-specific previews
- **"Run A/B test"** button
- Preview shows:
  - Bundle widget with actual pricing
  - Selected tier highlighted (radio button)
  - "BUNDLE & SAVE" header
  - Per-tier display: tier name, savings badge ("SAVE $270.72"), percentage ("You save 15%"), calculated price, strikethrough original price
  - Product image + name
  - "Choose" button for variant selection
  - "Most Popular" badge on recommended tier

---

## 22. Gap Analysis vs Bundlify

### Features Kaching Has That Bundlify Lacks

| Feature | Kaching | Bundlify | Priority |
|---------|---------|----------|----------|
| **12 bundle types** | Single, Duo, 3/4-pack, Qty breaks (same/different), BOGO, Collection, Complete-the-bundle, Subscribe & Save, Free gifts | MIX_AND_MATCH, BOGO, VOLUME | HIGH |
| **Swatch variant picker** | 7 types (color/image/product image, dropdown/inline), 3 shapes, size slider | None | MEDIUM |
| **Per-element typography** | 7 element groups x (font size + font style) = 14 controls | 1 font size + 1 font weight (global) | HIGH |
| **20 color controls** | 6 groups (General, Bar texts, Label, Badge, Free gift, Upsell) | 8 colors (after theming extension) | HIGH |
| **4 layout presets** | Visual thumbnails for card/horizontal/compact/minimal | 1 layout dropdown (grid/list/carousel) | MEDIUM |
| **Per-deal Custom CSS** | Toggle + scoped "All deals" / "This deal" tabs + line-numbered editor | 1 global custom CSS textarea | LOW |
| **Countdown timer** | Fixed duration / midnight / custom date, styled title bar with AI suggestions | None | HIGH |
| **Checkout upsells** | Multiple upsells with pricing, dynamic text, subscription option | None (only cart-based) | HIGH |
| **Progressive gifts** | Tiered unlock gifts with layout, labels, locked states | None | HIGH |
| **Sticky add to cart** | Full style customization (colors, typography, photo size, padding, radii) | None | MEDIUM |
| **A/B testing** | Built-in per-deal A/B test with archive | Has module but limited | MEDIUM |
| **Volume discount bundle with other products** | Cross-product volume discounting with product selector modal | Volume tiers (same product only) | HIGH |
| **Cart drawer** | Integrated cart drawer with shipping bar, timer, upsell carousel | Has cart drawer (basic) | MEDIUM |
| **Live preview** | Real-time right-panel preview with product/country selectors | None in admin | HIGH |
| **AI suggestions** | Timer title AI generation | None | LOW |
| **Bar system (mixed tiers)** | Mix quantity breaks + BOGO + upsell + subscription in one deal | Fixed tier types | HIGH |
| **Per-deal translations** | "Edit translations" per deal | Global translations only | LOW |
| **Compare-at price** | Checkbox toggle with strikethrough | Recently added (global toggle) | DONE |
| **Price rounding** | Checkbox toggle | None | LOW |
| **Update theme product price** | Override theme price display (per item / bundle price) | None | MEDIUM |
| **B2B exclusion** | Checkbox | None | LOW |
| **Discount-only-via-widget** | Prevents discount code stacking | None | MEDIUM |
| **Low stock alert** | Urgency indicator | None | LOW |
| **Sell as subscription** on upsells | Per-upsell subscription toggle | None | MEDIUM |

### Theming Comparison Summary

| Aspect | Kaching | Bundlify (Current) |
|--------|---------|-------------------|
| Color controls | 20 | 8 |
| Typography controls | 14 (per-element) | 2 (global) |
| Layout presets | 4 visual | 1 dropdown (3 options) |
| Corner radius | Per-element slider | 1 global slider |
| Spacing | Dedicated slider | None |
| Custom CSS | Per-deal scoped + global | Global only |
| Card shadow | N/A (uses border) | 4-level enum |
| Savings badge | Inline with tier | Global toggle |
| Sticky bar theming | 12 controls | N/A |

### Features Bundlify Has That Kaching Lacks

| Feature | Bundlify | Kaching |
|---------|----------|---------|
| **Margin-aware optimization** | Contribution margin calculator (COGS + shipping + processing + discount) | Revenue-only metrics |
| **Card shadow control** | 4-level shadow enum (none/subtle/medium/strong) | No shadow controls |
| **Exit-intent popup** | Dedicated extension block | None visible |
| **Shopify Flow integration** | Flow triggers/actions | None visible |
| **Affinity engine** | Product affinity scoring for smart recommendations | None visible |

---

## Recommended Implementation Priorities

### Phase 1 — Parity (Critical)
1. Add missing bundle types (Single, Duo, 3-pack, 4-pack, Collection, Complete-the-bundle)
2. Live preview panel in admin deal builder
3. Countdown timer per deal
4. Per-element typography (7 element groups)
5. Expand color controls to 20 (matching Kaching's 6 groups)

### Phase 2 — Competitive
6. Checkout upsells (checkbox add-ons in bundle widget)
7. Progressive gifts (tiered unlock system)
8. Swatch variant picker (at least color + image types)
9. 4 layout presets with visual thumbnails
10. Sticky add to cart bar

### Phase 3 — Differentiation
11. Per-deal Custom CSS scoping (All deals / This deal tabs)
12. Bar system with mixed tier types
13. A/B testing improvements
14. Cart drawer enhancements (shipping bar, timer, upsell carousel)
15. Volume discount across different products

### Phase 4 — Polish
16. AI-generated copy suggestions
17. Per-deal translations
18. Price rounding option
19. Theme product price override
20. B2B exclusion, discount-only-via-widget

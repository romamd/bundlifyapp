# Shopify Bundle App Storefront Research: Display Patterns, Widgets, Theming, and Integration

*Research date: February 2026*

---

## 1. Top Shopify Bundle Apps (2025-2026)

| App | Rating | Best For | Pricing | Key Differentiator |
|-----|--------|----------|---------|-------------------|
| **Simple Bundles** | 4.9 stars | Overall flexibility, enterprise | Free (3 bundles), from $24/mo | SKU-level breakdown for fulfillment, POS support |
| **Kaching Bundle Quantity Breaks** | 5.0 stars (1,800+ reviews) | AOV & ease of use | Free up to $1K revenue, from $14.99/mo | Perfect rating, quantity breaks, BOGO |
| **Bundler -- Product Bundles** | High | Beginners | Free tier | Bundle savings popups, simple setup |
| **PickyStory / Amplify** | 4.8 stars (746 reviews) | Medium-large stores | From $99.50/mo | AI-powered recommendations, PickyCart with tiered rewards |
| **Rebuy Personalization Engine** | Top-tier | Enterprise, full funnel | Premium | Smart Cart (35+ integrations), Dynamic Bundles, full-page PDP takeover |
| **Wide Bundles -- Quantity Breaks** | High | Design-heavy stores | From $18/mo | 100+ design options, replaces variant selector, A/B testing |
| **Fast Bundle Product (FBP)** | High | AI & customization | Free plan available | 8 bundle types, AI image generator |
| **AOV.ai Bundles & Volume Discounts** | High | Budget stores | 100% free plan | AI-powered FBT, zero cost entry |
| **BOGOS** | High | Advanced customization | Paid | Full customization, multiple discount structures |
| **Vitals** | High | All-in-one stores | Paid | 40+ tools in one app including basic bundling |

---

## 2. Frontend Display Patterns

### 2.1 Product Page (PDP) — Primary Display Location

**Inline App Blocks (below product info, above/below ATC button):**
- Most common: a "Frequently Bought Together" row showing the current product + 2-3 complementary items with checkboxes, individual prices, and a combined savings badge.
- **Wide Bundles** hides and replaces the native variant selector and add-to-cart button with its own bundle widget, making bundles appear as native product variants. Merchants can preselect the best offer by default.
- **Rebuy** offers a "Full-Page Dynamic Bundle Takeover" where the entire PDP is replaced by a multi-product bundle interface. Customers select variants of each bundled product and add all to cart with one click.

**Volume Discount Tables:**
- A tiered pricing table displayed directly on the product page showing escalating discounts (e.g., Buy 2 save 10%, Buy 3 save 15%, Buy 5 save 25%).
- Often styled as a horizontal strip of selectable quantity cards with the "best value" option highlighted.
- Apps like Snap Bundles and Wide Bundles specialize in this pattern.

**Bundle Builder (Multi-Step):**
- Rebuy's Bundle Builder provides a full-page, step-by-step bundling experience where customers pick products one at a time (e.g., "Pick a shirt > Pick pants > Pick a hat"), supporting up to 8 products per bundle.
- PickyStory offers both inline and dedicated page bundle builders with mix-and-match capabilities.

### 2.2 Cart Page / Cart Drawer

**Slide-out Cart Drawers with Upsells:**
- **iCart** provides a fully customizable slide-out cart with drag-and-drop widgets for upsells, cross-sells, progress bars, countdown timers, and announcement banners.
- **Rebuy Smart Cart** is described as "the most advanced shopping cart on Shopify" — a slide-out cart with 35+ pre-built integrations featuring tiered progress bars, "Buy More Save More" logic, gift with purchase, AI-powered upsells, and switch-to-subscription.
- **PickyStory's PickyCart** is a "genius cart" with tiered rewards (free shipping thresholds, free gifts, discounts).

**In-Cart Bundle Recommendations:**
- Apps like Selleasy and BOLD AI show relevant product recommendations inside the cart based on current cart contents.
- Progress bars to unlock free shipping or free gifts are extremely common, creating a gamification loop.

### 2.3 Checkout Display

- **Shopify Plus only**: Checkout UI Extensions allow bundle upsells directly in the checkout flow using the `purchase.checkout.cart-line-list.render-after` target.
- **BOLD AI** and **Rebuy** support checkout upsells as order bumps — last-minute deals surfaced right before payment.
- Post-purchase one-click upsells (displayed on the thank-you page) are offered by PickyStory, Essential Upsell, Selleasy, and BOLD AI.

### 2.4 Exit-Intent Popups

- Exit-intent is the second most popular popup type on Shopify after newsletter signups, with about 11% of mid-sized Shopify businesses using them.
- Average conversion rate for exit-intent campaigns: 2.8% (vs. 8.1% general popup average).
- **Desktop trigger**: cursor moves toward browser back button or address bar.
- **Mobile trigger**: tapping browser address bar, switching tabs, rapidly scrolling up.
- Typically shows a discount code or bundle offer with a countdown timer for urgency.
- Apps like **Bundler** specifically offer "bundle savings popups."

### 2.5 Other Display Locations

- **Homepage**: Top sellers, featured bundles, new arrivals as bundle collections.
- **Collection pages**: Bundle badges on product cards, inline bundle offers.
- **Post-purchase / Thank You page**: One-click upsell bundles after order completion.
- **Multi-touchpoint apps** like Cross Sell, Upsell and Bundles display across 8+ locations.

---

## 3. Widget Types (Comprehensive Catalog)

### 3.1 "Frequently Bought Together" (FBT)

- **Display**: Horizontal row with product images, "+" separators, total price, savings badge, single "Add All to Cart" button.
- **Data source**: AI-powered (AOV.ai, Rebuy, PickyStory analyze purchase history), merchant-curated, or hybrid.
- **Interaction**: Checkboxes to include/exclude individual items, variant selectors per item.
- **Used by**: AOV.ai, Selleasy, Fast Bundle, Rebuy, BOLD AI, PickyStory.

### 3.2 Volume Discount Tables

- **Display**: Horizontal strip of tiered pricing cards (e.g., "1 pack - $29", "2 pack - $25 each", "3 pack - $22 each BEST VALUE").
- **Interaction**: Click to select quantity tier, price updates dynamically.
- **Visual urgency**: "Most Popular" badges, strikethrough original prices, percentage savings callouts.
- **Used by**: Wide Bundles, Snap Bundles, Kaching, Fast Bundle.

### 3.3 Bundle Builder (Build-a-Box / Pick X from Y)

- **Display**: Full-page or embedded multi-step interface.
- **Interaction**: Step-by-step product selection with progress indicators, variant pickers per step, running total.
- **Gamification**: Progress bars, "Complete your bundle" messaging, unlock rewards at thresholds.
- **Used by**: Rebuy (full-page, up to 8 products), PickyStory, Mix and Match Bundle Builder, Simple Bundles.

### 3.4 Cross-Sell Recommendation Widgets

- **Display**: "You may also like" or "Complete the look" sections on PDP, cart, or homepage.
- **Data source**: AI (Rebuy, BOLD AI), rule-based, or manual.
- **Widget subtypes**: "Customer Also Bought", "Recently Viewed", "Complete the Look", "Top Sellers."
- **Used by**: Rebuy (6+ widget subtypes), BOLD AI, Selleasy.

### 3.5 Cart Upsell Drawers

- **Display**: Slide-out cart panel with embedded product recommendations, progress bars, and promotional content.
- **Components**: Product upsell cards, free shipping progress bar, countdown timer, announcement banner, gift with purchase indicator, subscription toggle.
- **Interaction**: One-click add, quantity adjustment, variant selection within the drawer.
- **Used by**: Rebuy Smart Cart, iCart, PickyStory PickyCart, HS Slide Cart.

### 3.6 Popup/Modal Offers

- **Display**: Overlay modal triggered by exit intent, time delay, scroll depth, or add-to-cart event.
- **Content**: Bundle discount offer, countdown timer, CTA button.
- **Targeting**: Page-specific, cart-value-based, visitor segmentation, traffic source, geo-targeting.
- **Frequency capping**: Once per session/day/week.
- **Used by**: Bundler (bundle savings popups), OptiMonk, Wisepops, Poptin.

### 3.7 Post-Purchase Upsells

- **Display**: One-click offer on the order confirmation / thank-you page.
- **Interaction**: Single click adds to the existing order (no re-entry of payment info).
- **Used by**: PickyStory, Essential Upsell, Selleasy, BOLD AI.

---

## 4. Theming & Customization Options

### 4.1 Color Customization

Every serious bundle app provides color controls:
- **Basic**: Primary color, accent color, text color.
- **Intermediate**: Per-element color pickers for badge background, button color, savings text, border, hover state.
- **Advanced**: Wide Bundles offers 100+ design options. Rebuy provides CSS selectors to style individual sections.

### 4.2 Layout Options

| Layout Pattern | Description | Used By |
|---------------|-------------|---------|
| **Horizontal row** | Products side-by-side with "+" icons (Amazon FBT style) | Most FBT widgets |
| **Vertical stack/list** | Products stacked vertically with checkboxes | Selleasy, Bundler |
| **Grid** | Products in a 2x2 or 3x3 grid | Rebuy Dynamic Bundles, PickyStory |
| **Carousel/slider** | Swipeable product cards | Cart drawer upsells |
| **Full-page takeover** | Entire PDP replaced by bundle interface | Rebuy Bundle Builder |
| **One-step layout** | All bundle options on a single page | Recharge Bundles |
| **Multi-step wizard** | Step-by-step product selection | Rebuy Bundle Builder |
| **Variant-replacement** | Replaces native variant selector | Wide Bundles |

### 4.3 Typography Controls

- **Recharge Bundles**: Separate font style controls for Super Titles, Headers, Descriptions, Step Titles, and Product Titles.
- **Rebuy**: CSS-level control over all font properties.
- **General pattern**: Most apps default to inheriting the theme's typography and provide override options for font family, size, weight, and color.

### 4.4 Button Styling

- Custom button text (e.g., "Add Bundle to Cart", "Save 20% - Buy Together")
- Button color, border radius, hover color
- Button size and padding
- Icon support (cart icon, checkmark)
- Some apps offer animated buttons or pulsing effects for urgency

### 4.5 Widget Position on Page

- Most app blocks let merchants drag-and-drop the widget position within the Shopify theme editor.
- Common positions: below product title, below price, below variant selector, below ATC button, in a dedicated section.
- App embed blocks allow floating/overlay positioning (popups, sticky bars, slide-outs) independent of page structure.

### 4.6 Mobile-Specific Styling

- Responsive by default — over 81% of Shopify traffic comes from mobile.
- Best practice: minimum 16px body text, 48px minimum tap targets, 1.5 line spacing.
- Rebuy exposes CSS selectors merchants can override for mobile breakpoints.
- Selleasy is specifically noted for being "super light" and not impacting page loading speeds.

---

## 5. Theme Integration Approaches

### 5.1 App Blocks (Modern Standard)

The recommended and dominant approach for inline PDP/cart widgets:
- Ships as a Theme App Extension containing Liquid blocks, JS assets, and CSS.
- Merchants add via Shopify theme editor (drag and drop).
- **Only works with Online Store 2.0 themes** (JSON templates, sections architecture).
- Auto-removed on app uninstall (no "ghost code").
- Settings defined in TOML config are exposed as controls in the theme editor.

**Standard file structure:**
```
extensions/
  bundlify-widget/
    shopify.extension.toml
    blocks/
      bundle-product-page.liquid
      bundle-cart-upsell.liquid
    assets/
      bundlify.js
      bundlify.css
    snippets/
    locales/
      en.default.json
```

### 5.2 App Embed Blocks

For non-inline UI elements (popups, floating widgets, analytics scripts):
- Render before `</head>` or `</body>` closing tags.
- **Works on both vintage and OS 2.0 themes.**
- Deactivated by default — merchants must enable in Theme Settings > App Embeds.
- Use case: exit-intent popups, floating cart upsell buttons, analytics.

### 5.3 ScriptTag Injection (Legacy)

- Injects JavaScript on every storefront page via the Shopify API.
- Cannot target specific pages.
- No access to Liquid template variables.
- Should only be used to support vintage themes.

### 5.4 Direct Theme Code Editing (Legacy — Restricted)

- Uses the Asset API to inject code into `theme.liquid`.
- Starting with Admin API 2023-04, requires special exemption from Shopify.
- Leaves ghost code on uninstall. Actively discouraged.

### 5.5 Integration Summary

| Approach | OS 2.0 | Vintage | Merchant Control | Clean Uninstall | Recommendation |
|----------|--------|---------|-----------------|----------------|---------------|
| **App Blocks** | Required | No | Full (theme editor) | Automatic | Primary method |
| **App Embed Blocks** | Yes | Yes | Toggle in settings | Automatic | Popups/overlays/scripts |
| **ScriptTag** | Possible | Yes | None | Partial | Legacy fallback only |
| **Asset API editing** | Yes | Yes | None (manual) | Ghost code | Restricted, avoid |

**Standard pattern for a modern bundle app:**
1. **App Block** for inline PDP bundle widget (product page, cart page sections).
2. **App Embed Block** for exit-intent popups, floating cart buttons, and analytics JS.
3. **Checkout UI Extension** (separate extension, React-based) for checkout upsells.
4. **ScriptTag** only as a fallback for vintage/non-OS 2.0 themes.

---

## 6. Relevance to Bundlify

### Current Architecture (Aligned with Best Practices)

- `apps/extensions/bundlify-widget/` — Theme App Extension with app blocks (`bundle-product-page.liquid`, `bundle-cart-upsell.liquid`) and vanilla JS/CSS assets.
- `apps/extensions/bundlify-checkout/` — Checkout UI Extension (React) targeting `purchase.checkout.cart-line-list.render-after`.

### Gaps vs. Competitors

| Gap | What Competitors Do | Priority |
|-----|-------------------|----------|
| **No cart drawer integration** | iCart, Rebuy Smart Cart, PickyStory all have slide-out cart with upsells + progress bars | High |
| **No volume discount table widget** | Wide Bundles, Kaching — very high conversion pattern | High |
| **Exit-intent is not an App Embed Block** | Should be an embed block (overlay across all pages/themes), not an app block | Medium |
| **Limited theming controls** | Competitors expose colors, layout, button text, badge format in theme editor via TOML settings | Medium |
| **No post-purchase upsell** | PickyStory, Selleasy offer one-click post-purchase offers | Low (future) |

### Unique Differentiator

**Margin-aware bundles** — no competitor surfaces margin data to the merchant. Bundlify's `MarginImpactCard` in the admin and margin-ranked bundle suggestions are genuine differentiators. Consider showing a "Profit Impact" preview in the admin widget configurator so merchants can see which bundle placement generates the most margin, not just revenue.

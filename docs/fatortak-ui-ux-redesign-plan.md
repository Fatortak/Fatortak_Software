# Fatortak UI/UX Redesign Plan

**Status:** In implementation — foundation and core modules shipped  
**Scope:** Visual system, interaction patterns, page templates, accessibility and rollout  
**Constraint:** Keep Fatortak’s identity and brand recognition. Move from heavy gradients and saturated blues/purples to a calmer, lighter, more professional product UI.  
**Implementation:** Shared tokens and primitives are live. Shell, dashboard, lists, forms, reports, settings and the full commercial document chain are migrated. Remaining work is accessibility/visual QA, public/print spot checks, Storybook and a few specialist operations pages.

---

## 0. Implementation progress

Shipped in the current rollout:

- Soft brand palette (`#6A4FD8`, hover `#583DBE`, tint `#F6F4FF`) and light canvas `#F7F8FC`.
- Inter + IBM Plex Sans Arabic, logical `start/end` spacing and RTL-safe table/cell alignment.
- Shared primitives: `Button`, `Card`, `Input`, `Textarea`, `Label`, `Select`, `Badge`, `Table`, `Dialog`, `Tabs`, `Alert`, `StatCard`, `PageHeader`.
- Light `page-hero` template replacing saturated gradient headers across core pages.
- Calm dashboard: KPI cards, business-health tiles, Recharts profit/growth chart and compact transaction/recent-invoice tables.
- List pages: clients, suppliers, sales/purchase invoices, items, projects, employees, team, stakeholders and expense categories.
- Settings: light tab navigation, company/user forms, image upload and consistent field styling.
- Auth: login, register, forgot/reset password aligned to the new system.
- Dark theme persists across reloads; dark surfaces, cards, tables, dialogs and chart grids are covered.
- Modal footers, compact table density, consistent status tinting and mobile 2-column KPI cards.
- Notification, profile, AI chat, OCR, subscription-plan and payment surfaces aligned to the same system.
- Quotations: list, builder, status flow, duplicate, details/print and conversion to a draft sales invoice.
- Sales orders: list, confirmed/invoiced status, details and conversion to a draft invoice.
- Purchase requisitions: requests, estimated lines, approval flow and status filters.
- Request for quotations: supplier invitations, per-line quotes, comparison and award to purchase order.
- Purchase orders: ordering, expected delivery, receiving progress, close and cancel.
- Goods receipts: partial/final receipts, rejected quantities, stock and weighted-cost posting.
- Supplier bill matching: bills from posted receipts, purchase-order linkage and price-variance flags.
- Credit/debit notes: linked invoice, line-level tax, posting reversal and adjusted balances.
- Recurring invoices: schedules, frequency, pause/resume, run-now and automatic generation.
- Approval queue: document candidates, thresholds, admin decisions and audit fields.
- Delivery notes: generated from confirmed sales orders, listed separately with details and print.
- Audit trail: `/activity` feed with filters, statistics, change details and IP/user attribution.
- Bank reconciliation: CSV import, candidate matching, ignore, adjustment transactions and statement closing at `/bank-reconciliation`.
- Price lists: default/customer-assigned lists, quantity breaks, customer assignment and resolved quotation pricing at `/price-lists`.
- Sales commissions: rules, generation, approval, payment, ledger posting and `/commissions`.
- Inventory valuation: cost valuation, low-stock flags, stock adjustments and weighted average cost at `/inventory`.
- Tax reporting: VAT return summary, line-level detail and JSON e-invoice export at `/tax-reports`.
- Global search: Ctrl/Cmd+K command palette and `/api/search` across customers, suppliers, items, invoices, quotations, purchase orders and projects.
- Document history: revision snapshots and change sets for invoices, quotations and purchase orders.
- Sessions and devices: `/sessions` device history, current-device marker, revoke-one and sign-out-others.
- Data operations: `/data-import` three-step CSV/TSV/Excel import wizard with competitor header aliases, automatic column mapping, validation preview, duplicate detection, bulk customer actions (item bulk APIs available) and saved activity views.
- Navigation: workflow-based sidebar groups with collapsible sections and active-group expansion.
- Form UX: shared required markers, inline errors, error summaries, date-range and line-item validation across the core document modals.
- Reports: grouped reports hub with search, tax report entry and working CSV/PDF export on every report.
- Invoice templates: live-preview gallery, brand colours, full preview/print page and current-template indicators.
- Onboarding: `/onboarding` checklist with progress and an idempotent demo dataset.
- Stakeholder statements: CSV export from the stakeholders page.

Still to do:

- Public invoice and print templates: final production logo/large-list spot check and cross-browser PDF check.
- A full accessibility audit: screen-reader certification and automated axe checks.
- Storybook/visual regression for the shared primitives.
- Multi-step approval chains (single-step administrator approval is live).
- Customer/supplier portal and payment links (separate portal repositories).
- Role/permission matrix editor.
- Multi-currency and exchange-rate revaluation.
- 2FA/SSO and refresh-token rotation.
- Mobile QA and broader frontend coverage for critical flows.

---

## 1. Design direction

### The problem today

The current UI works, but it feels assembled from several design directions:

- the brand is purple/indigo, while the primary app token is a strong blue;
- some pages use large gradients, glass effects and oversized numbers;
- cards, tables, forms and modals use different spacing, radius and shadow rules;
- slate, gray and raw hex colors are mixed;
- page headers, filters, empty states and actions are not consistent;
- some screens are visually dense while others have too much empty space;
- Arabic and English typography are not treated as one system;
- focus, loading, error and permission states are inconsistent.

### The target feeling

Fatortak should feel:

- **calm** — light surfaces, low visual noise, restrained color;
- **professional** — clear hierarchy, consistent density, trustworthy tables and forms;
- **warm** — soft lilac and neutral backgrounds rather than cold corporate blue;
- **Arabic-first** — typography, spacing and direction designed for Arabic, not mirrored afterward;
- **fast** — fewer clicks, obvious next actions, immediate feedback;
- **accessible** — readable contrast, keyboard support and clear focus states.

### Brand rule

Keep purple/indigo as the identity color. Use it for:

- primary actions;
- active navigation;
- links and focus rings;
- selected states;
- charts and highlights.

Do **not** use a full purple gradient on every page. Gradients are reserved for the logo, the authentication panel and occasional empty-state illustrations.

---

## 2. Color system

### 2.1 Brand purples

Use a softer, more comfortable purple than the current saturated violet. The palette keeps the identity while reducing visual fatigue.

| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#F6F4FF` | page tint, selected nav, subtle background |
| `brand-100` | `#ECE8FF` | active nav pill, soft badges |
| `brand-200` | `#D9D2FF` | borders, chart fills |
| `brand-300` | `#B9ACFF` | hover accents, disabled strong |
| `brand-400` | `#9584F5` | secondary charts |
| `brand-500` | `#7C63E8` | brand accent, icons |
| `brand-600` | `#6A4FD8` | primary button, links |
| `brand-700` | `#583DBE` | hover, pressed |
| `brand-800` | `#472F99` | headings on tinted surfaces |
| `brand-900` | `#36236F` | high-emphasis text on light lilac |

Primary button: `brand-600` with white text. Hover `brand-700`. Active `brand-800`.

### 2.2 Neutrals

| Token | Hex | Use |
|---|---|---|
| `canvas` | `#F7F8FC` | app background |
| `surface` | `#FFFFFF` | cards, tables, modals |
| `surface-alt` | `#F1F3F9` | table header, muted panels |
| `border` | `#E4E7EE` | default border |
| `border-strong` | `#D3D8E2` | inputs, dividers |
| `text` | `#1B1F2A` | primary text |
| `text-secondary` | `#5B6475` | descriptions, labels |
| `text-muted` | `#8A93A5` | placeholders, metadata |
| `text-disabled` | `#B2B9C7` | disabled |

Do not use pure black `#000` or pure gray `#808080`.

### 2.3 Semantic colors

| Token | Text/icon | Background | Use |
|---|---|---|---|
| Success | `#0F9F6E` | `#E9F9F2` | paid, active, positive |
| Warning | `#B87508` | `#FFF7E8` | pending, due soon, trial |
| Danger | `#D64545` | `#FDECEC` | overdue, destructive, errors |
| Info | `#3B6FE0` | `#EDF3FF` | informational, neutral actions |
| Neutral | `#5B6475` | `#F1F3F9` | draft, archived, inactive |

Never use a saturated background for a large area. Use the tint as background and the darker tone for text/icon.

### 2.4 Charts

Use a six-color chart palette derived from the brand:

1. `#6A4FD8` — brand purple
2. `#1C9A8B` — teal
3. `#E0A23A` — amber
4. `#3B6FE0` — blue
5. `#C85C8E` — rose
6. `#7D8CA3` — slate

Rules:

- one accent series, others neutral;
- grid lines at 8–10% opacity;
- no 3D, no heavy shadows;
- legends below the chart, not floating;
- always provide a table or accessible summary.

### 2.5 Dark mode

Dark mode should be soft, not black:

| Token | Hex |
|---|---|
| canvas | `#0E1220` |
| surface | `#151A2B` |
| surface-alt | `#1B2236` |
| border | `#2A3348` |
| text | `#EDF0F7` |
| text-secondary | `#A9B3C6` |
| brand-500 | `#9B8AF7` |

Avoid pure black and pure white in dark mode. Test contrast separately.

---

## 3. Typography

### 3.1 Font pairing

- **Arabic:** IBM Plex Sans Arabic or Noto Kufi Arabic. Prefer IBM Plex Sans Arabic for UI; Noto Kufi for headings only if needed.
- **Latin:** Inter (already used) or Plus Jakarta Sans.
- **Numbers:** tabular numerals for tables, invoices and financial reports.

Load Arabic and Latin with `unicode-range` so each script uses the right font without a flash of fallback text.

### 3.2 Type scale

| Style | Size | Weight | Line height | Use |
|---|---|---|---|---|
| Display | 30–36 | 700 | 1.2 | auth/landing only |
| Page title | 24 | 700 | 1.3 | page header |
| Section title | 18 | 600 | 1.4 | card/section |
| Card title | 16 | 600 | 1.4 | cards |
| Body | 14 | 400 | 1.6 (Arabic 1.75) | content |
| Label | 13 | 500 | 1.4 | form labels |
| Caption | 12 | 500 | 1.4 | metadata |
| Micro | 11 | 600 | 1.3 | badges, table headers |

Rules:

- Use 600 for emphasis, not 700/800 everywhere.
- Do not use all-caps for Arabic.
- Avoid letter-spacing on Arabic text.
- Keep line length 60–75 characters for prose.

---

## 4. Layout and spacing

- Base unit: 4px; common spacing: 8, 12, 16, 20, 24, 32, 40.
- App shell: sidebar 264px expanded, 76px collapsed; header 64px.
- Content padding: 24px desktop, 16px tablet, 12px mobile.
- Content max width: 1440px; forms max width 880px.
- Card padding: 20–24px; compact tables 16px.
- Card radius: 14px; inputs/buttons 10px; badges 999px.
- Shadows: `0 1px 2px rgba(16,24,40,.04)` and `0 8px 24px rgba(16,24,40,.06)`. No heavy elevation.
- Use borders before shadows to separate surfaces.

### Grid

- 12-column grid on desktop.
- KPI cards: 4-up desktop, 2-up tablet, 1-up mobile.
- Detail page: 8/4 split (main + side panel).
- Form page: 7/5 split or single column.
- Tables: full width with sticky first/last columns where needed.

---

## 5. App shell and navigation

### Sidebar

- Light `surface` background with a very subtle `brand-50` wash.
- Logo area 64px, divider below.
- Group labels: 11px uppercase (Latin) / 12px Arabic, muted.
- Active item: `brand-50` pill, `brand-700` text, 3px left indicator (right in RTL).
- Hover: `surface-alt`, no heavy color.
- Collapsed mode: icons only with tooltips.
- Submenu: indented, no nested cards.
- Footer: help, version, user.

### Header

- 64px, white, bottom border.
- Global search trigger with `⌘K` / `Ctrl K`.
- Quick-create button (primary).
- Period/branch selector where relevant.
- Notifications, language, theme, profile.
- No gradients.

### Global search / command palette

- One search for pages, customers, invoices, items, projects and actions.
- Recent items and suggested actions.
- Keyboard-first; `Esc` closes.
- Results grouped and keyboard navigable.

### Navigation principles

- Maximum three levels.
- Current location always visible via breadcrumb.
- Back behavior preserves filters and scroll.
- Cross-links: invoice → customer, customer → statement, project → invoices, stakeholder → transactions.

---

## 6. Component standards

### Buttons

| Variant | Use |
|---|---|
| Primary | one main action per page |
| Secondary | supporting action |
| Ghost | table row actions, toolbar |
| Destructive | delete/cancel with confirmation |
| Link | navigation inside text |

Heights: 36px compact, 40px default, 44px mobile. Icon + label gap 8px. Disabled opacity 50%, no pointer.

### Inputs and forms

- Label above input, 13px, 500.
- Required marker `*` with accessible text.
- Helper text below, 12px.
- Error text below in danger color, with icon.
- Focus ring 2px `brand-200` + border `brand-500`.
- One-column mobile; two-column desktop only for short related fields.
- Sticky footer with Save/Cancel on long forms.
- Unsaved-changes guard.

### Tables

- Header: `surface-alt`, 12px, 600, text-secondary.
- Row height 48px default, 40px compact.
- Hover `#FAFBFE`; selected `brand-50`.
- Sticky header; sticky totals for financial tables.
- Column visibility, density toggle, export, saved views.
- Bulk action bar appears above table when rows are selected.
- Empty state: icon, title, explanation, primary action.
- Mobile: card rows with key fields and an overflow menu.

### Cards

- White surface, 1px border, 14px radius, soft shadow.
- Header: title + optional description + actions.
- Body: 16–24px padding.
- No decorative gradient backgrounds except illustrations.
- KPI card: label, value, trend, small icon; value 24–28px, not 40px.

### Modals and drawers

- Modal max width 560/720/960.
- Header 20px title, close button.
- Footer right-aligned actions (left in RTL).
- Focus trap, `Esc` close, restore focus.
- Drawer for detail/edit when preserving context matters.
- Destructive confirmation requires the entity name and a clear consequence.

### Badges and statuses

Use soft badges:

- Paid: success tint.
- Pending: warning tint.
- Overdue: danger tint.
- Draft: neutral tint.
- Active: success.
- Inactive: neutral.

Do not use six saturated badge colors on one screen.

### Toasts and feedback

- Toast top-right (top-left in RTL), 4s, max 3 visible.
- Success includes the action performed.
- Errors include a retry or next step.
- Inline errors for forms; toasts for background actions.

### Loading, empty and error states

Every list/detail page needs:

- skeleton that matches the final layout;
- empty state with a primary action;
- error state with retry and support reference;
- permission state that explains who can grant access.

No full-page spinner for a table refresh.

---

## 7. Page-by-page redesign

### 7.1 Authentication

- Split layout: left brand panel with soft lilac gradient and product promise; right white form card.
- Keep logo, reduce decorative noise.
- Clear password rules and inline validation.
- Mobile: brand panel collapses to a compact header.

### 7.2 Dashboard

- Page header: greeting, period selector, export.
- Four KPI cards: revenue, expenses, cash, receivables.
- One primary trend chart with a clear period label.
- Secondary cards: receivables/payables aging, recent invoices, tasks.
- Remove oversized numbers and competing gradients.
- Show “no data yet” state for new tenants.

### 7.3 Quotations and commercial documents

Add a single document-chain workspace, not disconnected pages:

- Quotation list: status, customer, validity, total, owner, next action.
- Quotation builder: customer, price list, lines, terms, validity, version.
- Preview/print/email/WhatsApp.
- Accept/reject/expire with reason.
- Convert accepted quotation to sales order or invoice in one action.
- Purchase requisition, RFQ, purchase order and goods-received screens follow the same pattern.
- Status timeline at the top of every document.
- Clear “next step” banner: send, follow up, convert, approve or close.

### 7.4 Invoices (sales/purchase)

- Header: title, count, primary “New invoice”.
- Filter bar: search, status, date range, customer/supplier, branch.
- Table: number, party, date, due, total, paid, status, actions.
- Bulk actions: send, mark paid, export.
- Detail: header with status and actions; summary strip; items table; installments; attachments; activity.
- Form: customer, dates, items, discount, VAT, benefits, installments, attachment; sticky totals.
- Public invoice: print-first, no app shell, brand header, clear download/share, no index.

### 7.5 Accounting

- Chart of accounts: tree with search, type filter, balances, add child.
- Journal entries: table with debit/credit totals, status, source, date.
- Trial balance: sticky header and totals, balanced/not-balanced banner.
- Ledger: account selector, opening balance, running balance, export.
- Use tabular numerals and right alignment for amounts.

### 7.6 Reports

- Reports hub already exists; standardize cards.
- Every report: filter bar, date range, branch/project filter, export, print.
- Report body: chart + table + summary.
- Empty state explains which data is needed.
- Add a “last updated” line.

### 7.7 Customers, suppliers, items

- List: search, status, type, pagination, bulk actions.
- Detail: summary, invoices, statement, contacts, notes.
- Item form: image upload, pricing, VAT, stock, category; clear required fields.
- Use consistent side panels for quick view.

### 7.8 Projects

- Project list: status, client, contract value, collected, margin.
- Detail: overview, lines, invoices, expenses, profitability, documents.
- Use tabs instead of one very long page.
- Show a “project health” summary.

### 7.9 HR, payroll, attendance

- Employees: list + profile drawer, department filter.
- Attendance: daily/monthly tabs, period picker, bulk edit, export.
- Payroll: run status, period, totals, submit, payslips.
- Work settings: sectioned form with save per section.
- Use dense tables and clear totals; avoid decorative cards.

### 7.10 Treasury: cheques and custody

- Cheques: status board + table, due-date highlighting, actions.
- Custody: account cards + movement table, give/return/replenish actions.
- Status transitions must be visible and reversible only where allowed.

### 7.11 Team, roles, settings

- Team: role, status, last active, invite.
- Settings: left subnav + section cards; save per section.
- Billing/subscription: plan, usage, invoices, payment method.
- Danger zone separated with clear warnings.
- Installation insights: tenant/self-hosted scope, online status, data counts.

### 7.12 AI chat and OCR

- Chat: message list, citations, chart cards, composer, suggested questions.
- Streaming state and stop button.
- OCR: upload/drop zone, preview, extracted fields, confidence, create draft.
- Errors explain what file types and sizes are accepted.

### 7.13 Notifications and profile

- Notification center with filters and mark-all-read.
- Profile: photo, name, contact, password, sessions.
- Keep actions close to the data they affect.

---

## 8. UX flows and interaction rules

### First-run experience

- Onboarding checklist: company profile, chart of accounts, first customer, first invoice, team invite.
- Dismissible, progress persisted.
- Demo data option for evaluation.

### Permissions

- Disable or hide actions the user cannot perform.
- Explain why: “Ask an admin to grant the Editor role.”
- Server remains the source of truth; UI is not security.

### Destructive actions

- Confirm with entity name and consequence.
- Prefer soft delete/archive where possible.
- Undo toast for reversible actions.

### Forms

- Validate on blur and submit, not on every keystroke.
- Preserve drafts in local state.
- Warn before leaving with unsaved changes.
- Show server validation beside the field when possible.

### Search and filters

- Debounced search, 300ms.
- Filters visible as chips; clear-all.
- Preserve filters in the URL for shareable views.
- Saved views per user/tenant.

### Empty states

- Explain what will appear here.
- One primary action.
- Link to help/docs.

### Error recovery

- Show correlation ID from API.
- Retry action.
- Never show raw exception text in production.

### Keyboard

- `Ctrl/Cmd+K` search.
- `G` then `D` dashboard, `G` then `I` invoices (optional).
- `Esc` closes overlays.
- `Enter` submits forms; `Shift+Enter` newline in textareas.
- Visible focus rings everywhere.

### RTL

- Mirror layout, icons with direction, chevrons, breadcrumbs.
- Do not mirror logos, charts, or media controls.
- Use logical CSS properties (`margin-inline`, `padding-inline`).
- Test every new page in Arabic first, not last.

---

## 9. Accessibility

Target WCAG 2.2 AA.

- 4.5:1 contrast for body text; 3:1 for large text and UI boundaries.
- Visible focus, never `outline: none` without replacement.
- Labels for every input; errors linked with `aria-describedby`.
- Keyboard support for menus, dialogs, date pickers and tables.
- `aria-live` for toasts and async results.
- Reduced-motion support.
- 44px touch targets on mobile.
- Screen-reader test for Arabic and English.
- Avoid color-only status; pair with text/icon.

---

## 10. Motion and delight

- 150–200ms ease-out for hover, menus and dialogs.
- No bouncing cards, infinite tilt or decorative animation in work screens.
- Skeleton shimmer subtle and short.
- Respect `prefers-reduced-motion`.
- Confetti only for a genuine milestone, never for routine saves.

---

## 11. Design system implementation

### Tokens

Move all color, radius, spacing, typography and shadow values into semantic CSS variables and Tailwind theme extensions.

Naming:

- `--brand-*`
- `--surface-*`
- `--text-*`
- `--border-*`
- `--success-*`, `--warning-*`, `--danger-*`, `--info-*`

No raw hex in page components.

### Components

Build/standardize in `src/components/ui`:

- Button, IconButton, Input, Textarea, Select, Combobox, Checkbox, Radio, Switch.
- FormField, FormError, FormSection.
- Card, StatCard, PageHeader, SectionHeader.
- DataTable, TableToolbar, Pagination, BulkActionBar.
- Badge, StatusBadge, Avatar, Tooltip, Popover.
- Modal, Drawer, ConfirmDialog.
- Tabs, Breadcrumb, EmptyState, ErrorState, Skeleton.
- Toast, Alert, Progress.
- DatePicker, DateRangePicker, CurrencyInput, NumberInput.
- CommandPalette, SearchInput, FilterBar, FilterChip.

### Documentation

- Storybook for every shared component.
- Figma library matching tokens.
- Usage guidance: when to use, when not, accessibility notes, RTL example.
- Visual regression tests for key states.

### Guardrails

- No arbitrary Tailwind colors in new code.
- No new one-off modal/table/button implementations.
- Every page uses `PageHeader` and `DataTable` patterns.
- Design review required for new screens.
- Accessibility check in pull request template.

---

## 12. Rollout plan

### Phase 0 — Audit and foundations (1 week)

- Inventory every page and component.
- Screenshot current state.
- Approve palette, typography and density.
- Define tokens and component API.
- Set up Storybook/visual regression.

**Exit:** approved token sheet + component inventory.

### Phase 1 — Shell and core components (2 weeks)

- Sidebar, header, page header, cards, buttons, inputs, tables, badges, modals, toasts.
- Light/dark tokens.
- RTL primitives.
- Migrate the stakeholder and installation pages as pilots.

**Exit:** all core components documented; pilot pages pass accessibility and visual review.

### Phase 2 — High-traffic pages (3 weeks)

- Dashboard.
- Sales/purchase invoice lists and forms.
- Customers, suppliers, items.
- Reports hub and top reports.
- Settings and team.

**Exit:** 80% of daily user journeys use the new system.

### Phase 3 — Remaining modules (4–6 weeks)

- Accounting, journal entries, trial balance, ledger.
- Projects.
- HR, payroll, attendance.
- Cheques, custody.
- AI chat, OCR.
- Auth and public invoice.
- Subscription/payment.

**Exit:** no legacy page patterns remain in the primary navigation.

### Phase 4 — Quality and optimization (2 weeks)

- Accessibility audit and fixes.
- Keyboard and screen-reader testing.
- Mobile and tablet QA.
- Performance: code splitting, image optimization, font loading.
- Analytics and feedback round.

**Exit:** WCAG 2.2 AA checks pass; performance budget met.

---

## 13. Page priority matrix

| Priority | Pages | Reason |
|---|---|---|
| P0 | Auth, dashboard, invoice list/form, customers, reports, settings | Daily use; first impression |
| P1 | Accounting, projects, items, suppliers, team, subscription | Core operations |
| P2 | HR, payroll, attendance, cheques, custody, AI/OCR | Important but lower frequency |
| P3 | Public invoice, installation insights, edge settings | Specialized flows |

---

## 14. Metrics

### UX

- Task completion rate for top 10 tasks.
- Time to create an invoice/customer/project.
- Form error rate and abandonment.
- Support tickets tagged “confusing UI”.
- SUS or in-app satisfaction score.
- Mobile completion rate.

### Visual/technical

- Lighthouse accessibility ≥ 95.
- No critical axe violations.
- CLS < 0.1; LCP < 2.5s on mid-range mobile.
- 100% of shared components in Storybook.
- 0 raw hex colors in page components.
- RTL visual regression pass.

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Redesign breaks workflows | Pilot pages, feature flags, user testing before rollout |
| Too much change at once | Phase by page family; keep old components until replaced |
| Brand loses recognition | Keep purple/indigo identity; change saturation and surfaces, not the core hue |
| RTL handled late | Design every component in Arabic first |
| Inconsistent adoption | Shared components + design review + lint guardrails |
| Performance regression | Font subsetting, code splitting, image budgets |
| Accessibility treated as checklist | Automated + manual + screen-reader testing each phase |

---

## 16. Decisions required

1. Approve the softer purple/indigo palette and light canvas.
2. Choose Arabic UI font: IBM Plex Sans Arabic vs Noto Kufi Arabic.
3. Keep both light and dark mode, or light-first with dark later.
4. Approve 14px body / 24px page title density.
5. Approve sidebar 264/76px and header 64px.
6. Approve the page priority order.
7. Assign a design owner and a frontend systems owner.
8. Choose Storybook + visual regression tooling.

---

## 17. Definition of done

- A single token source controls color, type, spacing, radius and shadow.
- All primary navigation pages use the shared shell and page templates.
- All tables share search, filters, empty, loading, error and pagination patterns.
- All forms share labels, validation, required markers, save/cancel and unsaved-change protection.
- Arabic and English are both first-class, with RTL visual tests.
- WCAG 2.2 AA audit passes for critical flows.
- No page uses a one-off gradient, button, table or modal unless documented.
- Dashboard, invoice, report and settings task completion improves in usability testing.

Implementation status: foundation, core rollout, the full commercial document chain, audit, reconciliation, pricing, commissions, inventory, tax, global search, revisions, sessions, data operations, onboarding, multi-tenant self-registration and the SysAdmin platform console are in place. Remaining work is tracked in section 0 and in `IMPLEMENTATION_PLAN.md`.

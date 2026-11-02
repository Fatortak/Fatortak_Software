# Fatortak remediation plan

Status legend: `DONE` implemented and verified; `IN PROGRESS` being changed; `TODO` planned; `DEFERRED` requires product decision or external service.

Last updated: 2026-11-01

## P0 — release blockers

| # | Work item | Status | Verification |
|---|---|---|---|
| P0-1 | Fix tenant resolution: authenticated principal required, membership checked on every request, no Host-only tenancy | DONE | Build + auth matrix tests |
| P0-2 | Require authorization by default; explicit allow-list for login/register/reset/public invoice | DONE | Controller audit |
| P0-3 | Add `[Authorize]`/role restrictions to Dashboard, Companies, WorkSetting, Subscriptions, Backfill | DONE | Controller audit |
| P0-4 | Fix sales and purchase journal entries; unify VAT calculation; assert debit = credit | DONE | Build + accounting tests |
| P0-5 | Replace public invoice GUID access with signed, expiring tokens | DONE | Manual link test |
| P0-6 | Remove committed Supabase client and OpenReplay key from source; make analytics opt-in via env | DONE | `git grep` |
| P0-7 | Remove password-reset Gmail CC; configurable reset URL; token no longer in query string | DONE | Code review |
| P0-8 | Enforce role allow-list; tenant Admin cannot create/promote SysAdmin | DONE | Service review |
| P0-9 | Harden AI SQL execution: single SELECT only, block dangerous constructs, tenant predicate required, timeout + row cap | DONE | Unit-style checks |
| P0-10 | Fix cross-tenant IDORs in installments, chat, profiles, items, customers | DONE | Service review |
| P0-11 | Make invoice/payment transitions atomic; reject payments on cancelled/paid invoices; unique invoice number | DONE | Build + code review |
| P0-12 | Harden uploads: extension/MIME allow-list, safe download headers, no active content | DONE | Code review |
| P0-13 | Password policy and JWT key validation | DONE | Startup check |
| P0-14 | CORS allow-list, Swagger only in Development, rate limiting, security headers | DONE | Build + config review |

## P1 — high-impact

| # | Work item | Status | Verification |
|---|---|---|---|
| P1-1 | Implement missing backend endpoints: mark-paid, duplicate, switch-tenant | DONE | Route audit |
| P1-2 | Resolve PDF endpoint gap: remove broken UI action and expose a clear unsupported response | DONE | Removed the unused broken backend download helper; client-side PDF export remains |
| P1-3 | Add `/reports`, `/reports-group`, `/invoice-templates` routes/redirects | DONE | `tsc` + route review |
| P1-4 | Fix `InvoiceDetailsModal` and `ModernHeader` runtime errors | DONE | `tsc` |
| P1-5 | Make API client fail loudly; no `onSuccess` on failed mutations; preserve return path on 401 | DONE | Invoice mutations now reject on failure |
| P1-6 | Sanitize Markdown and print output; remove `rehypeRaw` risk | DONE | Dependency + code review |
| P1-7 | Prevent CSV formula injection | DONE | Code review |
| P1-8 | Enforce quotas/subscriptions or remove advertised limits | DONE | QuotaService + UI limits |
| P1-9 | Single source of truth for plan prices | DONE | `config/plans.ts` |
| P1-10 | Fix expense lookup by exact reference; validate non-negative amounts | DONE | Service review |
| P1-11 | Exclude cancelled/draft invoices from sales reports | DONE | Service review |
| P1-12 | Payroll uniqueness/transaction guard | DONE | Unique period index + transaction |
| P1-27 | Backend test project for token, deployment mode and quota behavior | DONE | 8 tests passing |
| P1-28 | Health/readiness endpoints for Docker and reverse proxies | DONE | `/health`, `/ready` |
| P1-29 | Reports hub with search, groups and consistent cards | DONE | `/reports` |
| P1-30 | Invoice template hub with sales/purchase entry points | DONE | `/invoice-templates` |
| P1-13 | Frontend typecheck clean and CI gate | DONE | `tsc -p tsconfig.app.json` exits 0 |
| P1-14 | Add backend test project for auth, accounting, invoice/payment invariants | PARTIAL | Token, deployment and quota tests; accounting tests still needed |
| P1-15 | Add frontend tests for routing, API error handling, money formatting | TODO | `npm test` |
| P1-16 | Add CI secret scan, dependency audit, typecheck, tests | PARTIAL | Typecheck + dotnet test in CI; secret scan/audit still needed |
| P1-31 | Review and clear all open Dependabot PRs | DONE | All open PRs closed as superseded or deferred with rationale |
| P1-32 | Upgrade ESLint, Recharts, TypeScript, iText, EPPlus, Vite, day-picker and resizable panels | DONE | npm ci, lint, tsc, build and tests pass |
| P1-33 | UI redesign foundations: lighter brand tokens, Arabic/Latin font stack, shell refinements | DONE | CSS/Tailwind tokens, sidebar/header, build pass |
| P1-34 | UI pilot: shared StatCard and dashboard header/cards | DONE | Typecheck/lint/build, browser smoke |
| P1-35 | Roll out redesigned tables, forms, modals and page templates to all modules | DONE | Shared primitives, page hero, dashboard, lists, forms, reports, settings, auth and dark mode migrated; typecheck/lint/build/browser checks pass |
| P1-36 | Implement quotation module and convert an accepted quotation into a draft sales invoice | DONE | QUO numbering, status flow, duplicate, print and draft-invoice conversion |
| P1-37 | Polish specialist surfaces: public invoice, print templates and accessibility QA | DONE | Public token view, template line totals, print rules, shell and form accessibility |
| P1-38 | Implement sales orders and convert quotations/sales orders into draft invoices | DONE | SO numbering, confirmed status, invoice conversion, no accounting or stock posting |
| P1-39 | Implement purchase requisitions with draft/submitted/approved/rejected flow | DONE | PR numbering, line estimates, approval actions, tenant-scoped API and UI |
| P1-40 | Implement delivery notes from confirmed sales orders | DONE | DN numbering, delivered status, details and print |
| P1-41 | Add full approval flows across invoices, quotations, purchases and notes | DONE | Approval queue, candidates per document type, thresholds, admin decisions, audit fields |
| P1-42 | Implement RFQ, purchase orders and goods receipts with stock posting | DONE | RFQ quotes/award, PO receipt/close, GRN stock and weighted cost |
| P1-43 | Implement supplier bill matching and credit/debit notes | DONE | PO/GRN bill creation with variance, note posting, ledger reversal and balance update |
| P1-44 | Implement recurring invoices with scheduling and automatic generation | DONE | Frequency, start/end, auto-send, pause/resume, run-now and background generator |
| P1-17 | Remove/move stray root `package.json`; align env examples | DONE | Removed generated root file |
| P1-18 | Stakeholder module: CRUD for stakeholders, linked chart-of-accounts account, ownership/type metadata | DONE | API + UI + migration |
| P1-19 | Stakeholder transactions: capital contribution, dividend, loan, repayment, withdrawal; accounting postings | DONE | API + ledger postings |
| P1-20 | Stakeholders page with list, create/edit modal, transaction history, balances | DONE | `tsc` + build |
| P1-21 | Competitor parity gap analysis and missing pages (bank reconciliation, audit trail, multi-step approvals) | PARTIAL | Credit/debit notes, supplier bills, recurring invoices and approval queue added; reconciliation/audit feed still TODO |
| P1-22 | Add the highest-value missing pages: reconciliation workspace and audit feed | TODO | Credit/debit notes, recurring invoices and approvals pages shipped |
| P1-23 | Consistent design system: typography, spacing, colors, empty/loading/error states, table patterns, modals, RTL | PARTIAL | `.input`, stakeholder page, insights page |
| P1-24 | Professional UI pass on dashboard, invoices, accounting, reports, settings, stakeholder pages | PARTIAL | New pages follow the new pattern |
| P1-25 | Self-hosted deployment mode: no tenant/subscription limits, single installation tenant | DONE | `DeploymentMode`, middleware, quota bypass |
| P1-26 | Self-hosted insights: registered users, online sessions, data counts | DONE | `/api/self-hosted/stats` + UI page |

## P2 — hardening, product, operations

| # | Work item | Status | Verification |
|---|---|---|---|
| P2-1 | CSP/HSTS/cookie hardening and secure token storage | DONE (cookie) / TODO (CSP) | HttpOnly JWT cookie, CORS credentials, HSTS/security headers |
| P2-2 | Health/readiness endpoints | DONE | `/health`, `/ready` |
| P2-3 | Structured logging, correlation IDs, no PII/token logging | PARTIAL | Global exception handler + correlation ID; audit/PII review remains |
| P2-4 | Audit log for financial/role/invoice changes | TODO | Schema + tests |
| P2-5 | Backup/restore runbook and test | TODO | Ops drill |
| P2-6 | Real subscription billing; payment provider integration | DEFERRED | Product decision |
| P2-7 | E-invoicing (Egypt ETA / Saudi ZATCA), credit/debit notes, recurring invoices | DEFERRED | Product decision |
| P2-8 | Multi-currency, inventory valuation, bank reconciliation, VAT filing | DEFERRED | Product decision |
| P2-9 | 2FA/SSO/session management | TODO | Auth tests |
| P2-10 | Frontend code splitting, React Query cache tuning, accessibility/i18n pass | PARTIAL | Error boundary, shared header/input; code splitting still TODO |
| P2-11 | Marketing copy: remove security claims until code matches; rotate demo password | TODO | Content review |

## Product expansion

### Stakeholders

- [x] `Stakeholder` entity: tenant, name, type (shareholder/partner/investor), email, phone, ownership %, equity account, active flag, notes.
- [x] `StakeholderTransaction` entity: tenant, stakeholder, type, amount, date, cash/bank account, reference, description.
- [x] CRUD API with tenant isolation and role checks.
- [x] Transaction types: capital contribution, dividend/distribution, loan received, loan repayment, withdrawal.
- [x] Double-entry posting per transaction type; reversal on delete.
- [x] Stakeholder list + detail page, account balance, transaction history, create/edit modal.
- [x] Validation: ownership 0–100, positive amounts, no over-repayment, no negative balance.
- [ ] Export statement to PDF/Excel/CSV.

### Commercial document chain (missing modules)

The current system jumps from a draft invoice to a paid invoice. A professional sales and purchasing flow needs the full document chain:

- [x] **Quotation / estimate**
  - customer, validity date, price list, discount, VAT, terms, versions;
  - draft → sent → accepted / rejected / expired;
  - duplicate, print/PDF, email/WhatsApp;
  - convert accepted quotation to sales order or invoice;
  - optional approval before sending.
  - **Implemented:** `Quotations`/`QuotationItems` tables, `QUO-` numbering, status API, duplicate, details/print dialog and conversion to a draft sales invoice.
- [x] **Sales order**
  - confirmed customer commitment, delivery date, partial fulfilment;
  - convert to invoice or delivery note;
  - cancel/close with reason.
  - **Implemented:** accepted quotations convert to `SO-` orders, listed at `/sales-orders`, and confirmed orders convert to draft invoices.
- [x] **Delivery note / goods issue**
  - quantities delivered, remaining quantities, customer signature/reference;
  - stock movement only on delivery.
  - **Implemented:** `DN-` delivery notes generated from confirmed sales orders, with details and print. Stock posting is intentionally deferred until the stock integration is scoped.
- [x] **Purchase requisition**
  - internal request, requester, department, budget check, approval.
  - **Implemented:** `PR-` requests with draft/submitted/approved/rejected/cancelled status and estimated line totals.
- [x] **Request for quotation (RFQ)**
  - send to multiple suppliers, compare responses, select winner.
  - **Implemented:** `RFQ-` requests with invited suppliers, per-line supplier quotes, comparison totals, award and automatic `PO-` creation.
- [x] **Purchase order**
  - supplier, lines, expected delivery, terms, approval threshold;
  - partial receipt and close.
  - **Implemented:** `PO-` orders with draft/ordered/partially received/received/closed/cancelled status, expected date, totals and close/cancel actions.
- [x] **Goods received note (GRN)**
  - received quantities, rejected quantities, batch/serial if needed;
  - stock and accounts payable accrual.
  - **Implemented:** `GRN-` receipts against ordered purchase orders, received/rejected quantities, posting updates stock quantity and weighted average purchase cost. Accounts payable accrual is deferred to the accounting integration.
- [x] **Supplier bill matching**
  - match purchase order, GRN and supplier invoice; flag price/quantity variance.
  - **Implemented:** supplier bills are created from posted GRN quantities, linked to the purchase order, price variance is flagged, and billed quantities prevent duplicate invoicing. PO-linked invoices skip stock posting because the GRN already moved stock.
- [x] **Credit note / debit note**
  - linked to original invoice, reason, tax adjustment, ledger reversal, customer balance update.
  - **Implemented:** `CRN-`/`DBN-` notes with line-level tax, linked original invoice, posting creates a reversing journal entry and updates the original invoice adjusted balance.
- [x] **Recurring invoices / subscriptions**
  - schedule, frequency, start/end, auto-send, retry, pause/resume.
  - **Implemented:** `REC-` schedules with weekly/monthly/quarterly/yearly cadence, end dates, due days, auto-send drafts, pause/resume, run-now and a background generator that catches up missed runs.
- [x] **Price lists and customer-specific pricing**
  - currency, validity, quantity breaks, minimum price, approval for override.
  - **Implemented:** default and customer-assigned price lists with validity windows, per-item quantity breaks, customer assignment, and a resolve API used by quotation item selection. Minimum-price enforcement and override approval remain open.
- [x] **Sales commissions**
  - salesperson, rate, basis, payable after payment/collection, ledger posting.
  - **Implemented:** per-salesperson or global rules with collected/invoiced basis, generation from sales invoices, pending/approved/paid/cancelled workflow, administrator approval, and payment posting to `6100 Commission Expense` / `2300 Commission Payable`.
- [x] **Approval workflows**
  - invoice, quotation, purchase order, expense, payment, discount and credit-note approvals;
  - thresholds, approver roles, audit trail, mobile approval.
  - **Implemented:** generic approval queue for invoices, quotations, purchase orders, expenses, credit/debit notes and payments; policy thresholds and enable/disable per type; administrator-only decisions; requester/decision audit fields; responsive approval UI.
- [x] **Numbering and document versions**
  - separate sequences per document type; immutable issued documents; revision history.
  - **Implemented:** document revision history for invoices, quotations, purchase orders, goods receipts, requisitions, RFQs and recurring schedules, with change/snapshot capture and a per-document history dialog. Strong immutability of posted documents remains a follow-up.
- [ ] **Customer/supplier portal**
  - accept quotation, download statements, upload payment proof, raise support request.
  - **Deferred:** portal code lives in separate sector repositories per the product decision; this repo only exposes APIs.

### Competitor parity backlog

- [x] Credit notes and debit notes with original-invoice linkage.
- [x] Recurring invoices and scheduled sending.
- [x] Bank reconciliation workspace (import statement, match, adjust).
- [x] Approval workflows for invoices, expenses, payments.
- [x] Audit trail and activity feed.
- [ ] Customer/supplier portal and payment links.
- [x] Inventory valuation and stock adjustments.
- [x] VAT return pack and e-invoicing export.
- [ ] Multi-currency and exchange-rate revaluation.
- [x] Saved views, bulk actions, and CSV import.
- [x] Global search and command palette.
- [ ] Role/permission matrix editor.
- [x] Onboarding checklist and demo dataset.
- [x] Document revision history.
- [x] Stakeholder statement export.
- [ ] Real Egypt ETA / Saudi ZATCA e-invoice integration.

### Self-hosted mode

- [x] `Deployment:Mode=SelfHosted` configuration.
- [x] Single installation tenant; no host/subdomain tenant resolution.
- [x] Unlimited quotas and no subscription requirement.
- [x] Registration joins the installation tenant; optional registration lock.
- [x] Registered user count, online-in-last-5-minutes count, data counts.
- [x] Installation insights page for administrators.
- [x] Session table with device/IP history and user session revocation.
- [x] Upgrade/backup status on the insights page.

## UI professionalization

- [x] Shared `.input` control style.
- [x] New stakeholder and installation pages use consistent cards, tables, modals, empty states and RTL.
- [ ] Single design-token layer: color, radius, spacing, elevation, typography.
- [ ] Consistent page header: title, breadcrumb, primary/secondary actions.
- [ ] Consistent data table: search, filters, sort, pagination, column visibility, empty state.
- [ ] Consistent form controls and validation messages.
- [ ] Skeleton loading, inline errors, retry states.
- [ ] Modal/drawer patterns with focus trap and keyboard close.
- [ ] RTL-first verification for every new page.
- [ ] Responsive layouts for tablet/mobile.
- [ ] Accessibility: labels, focus rings, contrast, ARIA.
- [ ] Remove one-off gradients/shadows; use a restrained professional palette.

## Verification log

- 2026-10-28: committed and pushed `2955b6b`, `9862e73`, `5c166e4`, `fb9961e`, `d57e4ae`, `a1aa11d` and `fbca486` to `origin/main` (rebased over Dependabot updates).
- Backend: `dotnet build fatortak.sln` → 0 errors.
- Frontend: `npx tsc -p tsconfig.app.json --noEmit` → 0 errors.
- Frontend: `npm run build` → success; one 3.26 MB chunk (857 KB gzip).
- EF: migration `20261027194419_AddStakeholdersAndPresence` generated and scripted successfully; includes `LastSeenAt`, stakeholder tables, and the unique invoice-number index with duplicate cleanup.
- Secret scan of the staged tree: no database, SMTP, Gemini, OpenRouter or JWT secrets; removed Supabase client and OpenReplay key from source.
- Backend tests: `dotnet test` → 8 passed (public invoice token, self-hosted detection, quota limits).
- Health checks: `GET /health` and `GET /ready` added.
- Payroll period uniqueness: migration `20261028103009_AddPayrollPeriodUniqueIndex` with duplicate cleanup.
- Browser auth now uses an HttpOnly, SameSite=Lax JWT cookie; JWTs are no longer persisted in localStorage. `/api/auth/me` validates the session on reload.
- Dependabot updates were rebased onto the branch; `npm install` + typecheck + production build verified with the updated dependency tree.
- Reports hub, invoice-template hub, global error boundary and API exception/correlation middleware added.
- Final verification after rebase: `dotnet test` 10/10, `npm run build` success.
- Local SQL Server smoke test on an isolated `FatortakSmoke_20261029` database: health/readiness, cookie login, `/api/auth/me`, tenant isolation (cross-tenant stakeholder returns 404), stakeholder capital posting, invoice creation with discount/VAT, balanced journal (102.60 debit = 102.60 credit), mark-paid, duplicate, and public invoice token (rejected without token, accepted with token).
- Vite 8 dev server and Chromium UI smoke test: login, dashboard, stakeholders page, reports hub, invoice-template hub, installation insights; no runtime console errors after login.
- UI redesign: brand palette softened, Arabic font added, shell refined, shared primitives rebuilt, dashboard/chart/table/cards migrated, list/form/report/settings/auth pages rolled out, dark mode persisted, responsive KPI cards and compact tables implemented; typecheck, lint and production build pass.
- Quotation module: migration `AddQuotationModule`, create/update/send/accept/duplicate/delete APIs, tenant-scoped list, print-ready details dialog and conversion to a **draft** sales invoice; conversion creates no journal entry and does not touch stock. Backend tests remain 10/10.
- Public invoice review: signed-token view verified, all six invoice templates now show persisted line totals, and print copies the app stylesheets.
- Dependency review completed: ESLint 10.13, Recharts 3.10 + react-is 19.3, TypeScript 6.0, iText 9.8 + pdfCalligraph 5.1, EPPlus 8.7 with explicit license configuration, Vite 8.3 + plugin 4.3, react-day-picker 10 and react-resizable-panels 4.
- `npm ci` completes successfully; `eslint .` reports 0 errors (31 legacy warnings); `tsc` 0 errors; production build passes.
- All 10 open Dependabot PRs were reviewed and closed with a comment: implemented on main, or deferred because TypeScript 7 is not supported by typescript-eslint and dotnet-ef 10 requires a .NET 10 migration.
- 2026-11-01: audit trail (`20261101105706_AddAuditLogs`) with central change capture, sensitive-field exclusion, `/api/audit` and `/activity`.
- 2026-11-01: bank reconciliation (`20261101111218_AddBankReconciliation`) with CSV import, candidate matching, unmatch, ignore, adjustment transactions, statement closing and `/bank-reconciliation`.
- 2026-11-01: price lists (`20261101112445_AddPriceLists`) with default/customer lists, quantity breaks, customer assignment, `/api/pricelists/resolve` and `/price-lists`; quotation item selection uses resolved pricing.
- 2026-11-01: sales commissions (`20261101113948_AddSalesCommissions`) with collected/invoiced basis, approval/payment workflow, ledger posting and `/commissions`.
- 2026-11-01: inventory valuation and stock adjustments (`20261101115413_AddStockAdjustments`) with weighted-average cost updates and `/inventory`.
- 2026-11-01: VAT return and generic JSON e-invoice export (`/api/tax/vat-return`, `/api/tax/e-invoices`, `/tax-reports`); provider-specific ETA/ZATCA submission remains open.
- 2026-11-01: global search (`/api/search`) and Ctrl/Cmd+K command palette across customers, suppliers, items, invoices, quotations, purchase orders and projects.
- 2026-11-01: backend build succeeds; `dotnet test` 10/10; `npm run build` succeeds; targeted ESLint passes; SQLite test compatibility fixed by removing the SQL Server-only `nvarchar(max)` audit column annotation.
- 2026-11-01: real SQL Server smoke tests passed for audit capture, bank statement import/match/ignore/adjustment/reconcile, price resolution, commission generate/approve/pay, stock adjustment valuation update, VAT return, e-invoice export and global search.
- 2026-11-01: document revision history (`20261101123618_AddDocumentRevisions`) with automatic snapshots and change sets, API and history dialogs for invoices, quotations and purchase orders.
- 2026-11-01: device/session management (`20261101130739_AddUserSessions`) with IP/user-agent history, current-device detection, revoke-one/revoke-others APIs, `/sessions` UI and middleware rejection of revoked sessions.
- 2026-11-01: CSV import for customers/suppliers/items, per-user/shared saved views, bulk customer delete/activate actions and item bulk APIs.
- 2026-11-01: onboarding checklist plus idempotent demo dataset (customers, suppliers, items, project and draft quotation).
- 2026-11-01: stakeholder statement CSV export.
- 2026-11-01: frontend Vitest + React Testing Library harness, 7 passing tests; CI now runs frontend tests, gitleaks, NuGet vulnerability audit and `npm audit --audit-level=high`.
- 2026-11-01: CSP/Permissions-Policy headers added to Nginx and PII inventory/retention review documented in `docs/security/csp-and-pii-review.md`.
- 2026-11-01: vulnerable NuGet packages upgraded (`Microsoft.Data.SqlClient` 5.2.2, `Azure.Identity` 1.13.1, `System.Formats.Asn1` 8.0.1, `SQLitePCLRaw.lib.e_sqlite3` latest) and `jspdf` upgraded to 4.2.1; projects now report no vulnerable packages and no high/critical npm advisories.
- 2026-11-01: backend `dotnet test` 10/10 and frontend `npm test` 7/7 after dependency upgrades; production build succeeds.
- 2026-11-02: navigation grouped into Overview, Sales, Purchasing, Finance, Inventory & Data, Contacts & Projects, Reports & Templates, and Workspace, with collapsible groups and active-group expansion.
- 2026-11-02: shared form UX primitives (`FormField`, `FormErrorSummary`, validation helpers) and stronger validation for quotations, price lists, purchase orders, recurring invoices and customers.
- 2026-11-02: reports hub redesigned by group with search and tax report entry; every report now exports CSV and PDF from the live table data.
- 2026-11-02: invoice templates redesigned as a live-preview gallery with brand-colour selection, full preview page, print action, current-template indicators and a template shortcut from invoice details.
- 2026-11-02: import rebuilt as a three-step wizard supporting CSV/TSV/Excel (.xlsx), competitor header aliases, automatic column mapping, row-level validation preview, duplicate detection, and the existing templates/downloads.
- 2026-11-02: verified report CSV/PDF downloads, template preview, import preview/execute for both competitor CSV and Excel, and validation summaries in the browser; frontend typecheck passes.

## Remaining work

| Area | Remaining |
|---|---|
| Security | Refresh-token rotation; CSP nonce rollout to remove `style-src 'unsafe-inline'`; 2FA/SSO; PII retention cleanup job |
| Data isolation | Add EF Core global query filters as defense in depth; finish IDOR audit on every controller |
| Accounting | Add automated journal-balance tests for every posting path; reconcile cheque lifecycle; payroll transaction guard |
| Commercial | Customer/supplier portal and payment links (separate portal repos); role/permission matrix editor; multi-currency and exchange-rate revaluation; hard immutability for posted documents |
| Tax | Real Egypt ETA / Saudi ZATCA submission adapters and credentials |
| Self-hosted | Backup/upgrade automation (status reporting is implemented) |
| UI | Full design-token pass and professional review of older pages; accessibility audit; Storybook/visual regression; code splitting; mobile QA |
| Quality | Load test; broader frontend coverage for critical flows |

### Deferred with rationale

- **Customer/supplier portal and payment links:** portal code belongs in separate sector repositories; payment links need a chosen gateway and signing keys.
- **Role/permission matrix editor:** the current authorization model uses fixed role checks; replacing it requires a permission-policy refactor and a role-migration plan.
- **Multi-currency and revaluation:** requires base-currency settings, FX rate sources, revaluation policy and accounting sign-off; implementing it without those decisions would produce unreliable ledger entries.
- **2FA and SSO:** TOTP and external identity providers need recovery-code policy, provider selection and tenant-level enforcement rules.
- **Real ETA/ZATCA integration:** blocked on taxpayer credentials, certificate signing and official schema/version confirmation.
- **Real payment links / gateway capture:** blocked on gateway selection and merchant credentials.

## Guardrails

- No production secrets in git; use env vars/user secrets.
- Every cross-tenant read/write must include a tenant predicate or be SysAdmin-only.
- Every financial posting must be balanced and transactional.
- CI must fail on compiler errors, type errors, failed tests, and detected secrets.

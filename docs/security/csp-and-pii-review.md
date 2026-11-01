# CSP and PII review

Date: 2026-11-01

## Content Security Policy

The production Nginx configuration now sends:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: http: ws: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; form-action 'self'
```

Notes:

- `style-src 'unsafe-inline'` is required by the current React/Tailwind runtime and inline print styles. Removing it needs a nonce/hash rollout for every inline style.
- `connect-src` allows the configured API origin. Tighten it to the exact production API host and WebSocket origin before release.
- `frame-ancestors 'self'` keeps the app out of third-party frames while allowing same-origin public invoice preview.
- `object-src 'none'` and `base-uri 'self'` close the main injection escape hatches.
- The public invoice page must be checked after enabling CSP because it uses print-specific inline styles and generated PDFs.

Still recommended:

- Remove `'unsafe-inline'` from `style-src` with a nonce or build-time style extraction.
- Add `Strict-Transport-Security` at the TLS terminator once HTTPS is mandatory.
- Add a report-only rollout for one release before enforcing the final API/WebSocket host list.

## PII inventory

| Data | Where | Purpose | Controls |
|---|---|---|---|
| Customer/supplier name, email, phone, address, tax number | `Customers` | Billing, VAT, statements | Tenant-scoped queries, audit log, soft delete |
| User name, email, phone, profile image | `AspNetUsers` | Authentication, collaboration | Identity hashing, role checks, session tracking |
| Session IP address and user agent | `UserSessions` | Device/session management, account security | Visible only to the session owner; revocable |
| Invoice, quotation and purchase-order contents | Document tables | Commercial records | Tenant isolation, audit/revision history |
| Bank statement lines | `BankStatements` / `BankStatementLines` | Reconciliation | Tenant isolation, no external transmission |
| AI chat messages | `ChatSessions` / `ChatMessages` | Optional assistant feature | Tenant isolation, provider opt-in, retention review needed |
| Employee salary, attendance and payroll | HR/payroll tables | Payroll processing | Role restrictions, audit trail |

## Logging and retention review

- Audit logs exclude password hashes, security stamps, concurrency stamps and tenant identifiers.
- Application logs can include request paths and entity identifiers; they must not log request bodies, tokens or credentials.
- Session rows retain IP/user-agent until revoked or expired; add a scheduled cleanup job for expired sessions older than 90 days.
- Chat messages and generated AI content have no automated retention limit yet; define a workspace-level retention policy before enabling AI broadly.
- Soft-deleted customers/items remain in the database; add a documented purge process for permanent deletion requests.
- Backups may contain all of the above; the backup directory must be access-controlled and encrypted at rest.

## Follow-ups

- Add a `PiiRetention` background service for expired sessions and old chat messages.
- Run a data-subject export/delete runbook before onboarding regulated customers.
- Review third-party AI/email providers against the workspace's data-processing agreement.
- Re-run this review whenever a new external integration or analytics provider is enabled.

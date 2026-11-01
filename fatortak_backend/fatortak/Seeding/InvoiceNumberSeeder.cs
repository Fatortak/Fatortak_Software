using fatortak.Common.Enum;
using fatortak.Context;
using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace fatortak.Seeding
{
    public static class InvoiceNumberSeeder
    {
        public static async Task FixInvoiceNumbersAsync(ApplicationDbContext context)
        {
            var tenants = await context.Tenants.ToListAsync();

            foreach (var tenant in tenants)
            {
                var company = await context.Companies.FirstOrDefaultAsync(c => c.TenantId == tenant.Id);
                string prefix = company?.InvoicePrefix ?? "INV-";

                var legacyInvoices = await context.Invoices
                    .Where(i => i.TenantId == tenant.Id &&
                                (i.DocumentType == null || i.DocumentType == ""))
                    .ToListAsync();
                foreach (var invoice in legacyInvoices)
                    invoice.DocumentType = "Invoice";

                // Retrieve all regular invoices for this tenant, ordered by creation date.
                // Credit/debit notes keep their own CRN-/DBN- sequences.
                var invoices = await context.Invoices
                    .Where(i => i.TenantId == tenant.Id && i.DocumentType == "Invoice")
                    .OrderBy(i => i.CreatedAt)
                    .ToListAsync();

                long counter = 1;
                foreach (var invoice in invoices)
                {
                    invoice.InvoiceNumber = $"{prefix}{counter.ToString().PadLeft(4, '0')}";
                    counter++;
                }
            }

            if (context.ChangeTracker.HasChanges())
            {
                await context.SaveChangesAsync();
            }
        }
    }
}

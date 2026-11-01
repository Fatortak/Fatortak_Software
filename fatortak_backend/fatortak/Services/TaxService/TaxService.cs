using fatortak.Context;
using fatortak.Dtos.Tax;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.TaxService
{
    public interface ITaxService
    {
        Task<ServiceResult<VatReturnDto>> GetVatReturnAsync(DateTime fromDate, DateTime toDate);
        Task<ServiceResult<EInvoiceExportDto>> GetEInvoiceExportAsync(DateTime fromDate, DateTime toDate);
    }

    public class TaxService : ITaxService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public TaxService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<VatReturnDto>> GetVatReturnAsync(DateTime fromDate, DateTime toDate)
        {
            var tenantId = GetTenantId();
            var excluded = new[] { "Draft", "Cancelled" };
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Where(i => i.TenantId == tenantId &&
                            i.IssueDate >= fromDate.Date &&
                            i.IssueDate <= toDate.Date.AddDays(1) &&
                            !excluded.Contains(i.Status))
                .OrderBy(i => i.IssueDate)
                .ThenBy(i => i.InvoiceNumber)
                .ToListAsync();

            var lines = invoices.Select(i => new VatReturnLineDto
            {
                Date = i.IssueDate,
                DocumentType = i.DocumentType == "Invoice"
                    ? (i.InvoiceType == "Buy" ? "Purchase invoice" : "Sales invoice")
                    : (i.DocumentType == "CreditNote" ? "Credit note" : "Debit note"),
                Number = i.InvoiceNumber,
                PartyName = i.Customer?.Name,
                TaxableAmount = i.Subtotal - i.TotalDiscount,
                VatAmount = i.VatAmount,
                Total = i.Total
            }).ToList();

            var salesLines = invoices.Where(i => i.InvoiceType == "Sell").ToList();
            var purchaseLines = invoices.Where(i => i.InvoiceType == "Buy").ToList();

            return ServiceResult<VatReturnDto>.SuccessResult(new VatReturnDto
            {
                FromDate = fromDate.Date,
                ToDate = toDate.Date,
                SalesTaxable = salesLines.Sum(i => i.Subtotal - i.TotalDiscount),
                OutputVat = salesLines.Sum(i => i.VatAmount),
                PurchaseTaxable = purchaseLines.Sum(i => i.Subtotal - i.TotalDiscount),
                InputVat = purchaseLines.Sum(i => i.VatAmount),
                NetVat = salesLines.Sum(i => i.VatAmount) - purchaseLines.Sum(i => i.VatAmount),
                Lines = lines
            });
        }

        public async Task<ServiceResult<EInvoiceExportDto>> GetEInvoiceExportAsync(
            DateTime fromDate, DateTime toDate)
        {
            var tenantId = GetTenantId();
            var invoices = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.InvoiceItems)
                .Where(i => i.TenantId == tenantId &&
                            i.InvoiceType == "Sell" &&
                            i.DocumentType == "Invoice" &&
                            i.Status != "Draft" &&
                            i.Status != "Cancelled" &&
                            i.IssueDate >= fromDate.Date &&
                            i.IssueDate <= toDate.Date.AddDays(1))
                .OrderBy(i => i.IssueDate)
                .ToListAsync();

            return ServiceResult<EInvoiceExportDto>.SuccessResult(new EInvoiceExportDto
            {
                FromDate = fromDate.Date,
                ToDate = toDate.Date,
                Invoices = invoices.Select(i => new EInvoiceDto
                {
                    Id = i.Id,
                    InvoiceNumber = i.InvoiceNumber,
                    IssueDate = i.IssueDate,
                    CustomerName = i.Customer?.Name,
                    CustomerTaxNumber = i.Customer?.TaxNumber,
                    Currency = i.Currency,
                    Subtotal = i.Subtotal,
                    VatAmount = i.VatAmount,
                    Total = i.Total,
                    Lines = i.InvoiceItems.Select(line => new EInvoiceLineDto
                    {
                        Description = line.Description ?? string.Empty,
                        Quantity = line.Quantity.GetValueOrDefault(),
                        UnitPrice = line.UnitPrice.GetValueOrDefault(),
                        VatRate = line.VatRate.GetValueOrDefault(),
                        LineTotal = line.LineTotal.GetValueOrDefault()
                    }).ToList()
                }).ToList()
            });
        }

        private Guid GetTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}

using fatortak.Context;
using fatortak.Dtos.Search;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.SearchService
{
    public interface IGlobalSearchService
    {
        Task<ServiceResult<List<GlobalSearchResultDto>>> SearchAsync(string term);
    }

    public class GlobalSearchService : IGlobalSearchService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public GlobalSearchService(ApplicationDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<List<GlobalSearchResultDto>>> SearchAsync(string term)
        {
            if (string.IsNullOrWhiteSpace(term) || term.Trim().Length < 2)
                return ServiceResult<List<GlobalSearchResultDto>>.SuccessResult(new List<GlobalSearchResultDto>());

            var tenantId = GetTenantId();
            var search = term.Trim().ToLower();
            var results = new List<GlobalSearchResultDto>();

            results.AddRange(await _context.Customers
                .Where(c => c.TenantId == tenantId && !c.IsDeleted &&
                            (c.Name.ToLower().Contains(search) ||
                             (c.Email != null && c.Email.ToLower().Contains(search)) ||
                             (c.Phone != null && c.Phone.Contains(search))))
                .OrderBy(c => c.Name)
                .Take(5)
                .Select(c => new GlobalSearchResultDto
                {
                    Type = c.IsSupplier ? "Supplier" : "Customer",
                    Id = c.Id.ToString(),
                    Title = c.Name,
                    Subtitle = c.Email,
                    Route = c.IsSupplier ? "/suppliers" : "/clients"
                }).ToListAsync());

            results.AddRange(await _context.Items
                .Where(i => i.TenantId == tenantId && !i.IsDeleted &&
                            (i.Name.ToLower().Contains(search) ||
                             (i.Code != null && i.Code.ToLower().Contains(search))))
                .OrderBy(i => i.Name)
                .Take(5)
                .Select(i => new GlobalSearchResultDto
                {
                    Type = "Item",
                    Id = i.Id.ToString(),
                    Title = i.Name,
                    Subtitle = i.Code,
                    Route = "/items"
                }).ToListAsync());

            results.AddRange(await _context.Invoices
                .Where(i => i.TenantId == tenantId &&
                            i.DocumentType == "Invoice" &&
                            (i.InvoiceNumber.ToLower().Contains(search) ||
                             i.Customer.Name.ToLower().Contains(search)))
                .OrderByDescending(i => i.CreatedAt)
                .Take(5)
                .Select(i => new GlobalSearchResultDto
                {
                    Type = i.InvoiceType == "Buy" ? "Purchase invoice" : "Sales invoice",
                    Id = i.Id.ToString(),
                    Title = i.InvoiceNumber,
                    Subtitle = i.Customer.Name,
                    Route = i.InvoiceType == "Buy" ? "/buy-invoices" : "/sell-invoices"
                }).ToListAsync());

            results.AddRange(await _context.Quotations
                .Where(q => q.TenantId == tenantId && q.DocumentType == "Quotation" &&
                            (q.QuotationNumber.ToLower().Contains(search) ||
                             q.Customer.Name.ToLower().Contains(search)))
                .OrderByDescending(q => q.CreatedAt)
                .Take(5)
                .Select(q => new GlobalSearchResultDto
                {
                    Type = "Quotation",
                    Id = q.Id.ToString(),
                    Title = q.QuotationNumber,
                    Subtitle = q.Customer.Name,
                    Route = "/quotations"
                }).ToListAsync());

            results.AddRange(await _context.PurchaseOrders
                .Where(p => p.TenantId == tenantId &&
                            (p.PoNumber.ToLower().Contains(search) ||
                             p.Supplier.Name.ToLower().Contains(search)))
                .OrderByDescending(p => p.CreatedAt)
                .Take(5)
                .Select(p => new GlobalSearchResultDto
                {
                    Type = "Purchase order",
                    Id = p.Id.ToString(),
                    Title = p.PoNumber,
                    Subtitle = p.Supplier.Name,
                    Route = "/purchase-orders"
                }).ToListAsync());

            results.AddRange(await _context.Projects
                .Where(p => p.TenantId == tenantId &&
                            (p.Name.ToLower().Contains(search) ||
                             (p.Description != null && p.Description.ToLower().Contains(search))))
                .OrderBy(p => p.Name)
                .Take(5)
                .Select(p => new GlobalSearchResultDto
                {
                    Type = "Project",
                    Id = p.Id.ToString(),
                    Title = p.Name,
                    Subtitle = p.Status.ToString(),
                    Route = "/projects"
                }).ToListAsync());

            return ServiceResult<List<GlobalSearchResultDto>>.SuccessResult(
                results.OrderBy(r => r.Type).ThenBy(r => r.Title).Take(25).ToList());
        }

        private Guid GetTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}

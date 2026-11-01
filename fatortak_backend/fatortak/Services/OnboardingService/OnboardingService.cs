using fatortak.Context;
using fatortak.Dtos.Customer;
using fatortak.Dtos.Item;
using fatortak.Dtos.Onboarding;
using fatortak.Dtos.Quotation;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Services.CustomerService;
using fatortak.Services.ItemService;
using fatortak.Services.QuotationService;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.OnboardingService
{
    public interface IOnboardingService
    {
        Task<ServiceResult<OnboardingProgressDto>> GetProgressAsync();
        Task<ServiceResult<DemoDataResultDto>> SeedDemoDataAsync();
    }

    public class OnboardingService : IOnboardingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICustomerService _customerService;
        private readonly IItemService _itemService;
        private readonly IQuotationService _quotationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OnboardingService(
            ApplicationDbContext context,
            ICustomerService customerService,
            IItemService itemService,
            IQuotationService quotationService,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _customerService = customerService;
            _itemService = itemService;
            _quotationService = quotationService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<OnboardingProgressDto>> GetProgressAsync()
        {
            var tenantId = TenantId;
            var demoLoaded = await _context.Customers
                .AnyAsync(c => c.TenantId == tenantId && c.Name.StartsWith("Demo -"));

            var steps = new List<OnboardingStepDto>
            {
                await StepAsync("company", "Company profile", "Add your legal name, tax number and invoice template.",
                    "/settings", _context.Companies.AnyAsync(c => c.TenantId == tenantId)),
                await StepAsync("accounts", "Chart of accounts", "Keep the seeded chart of accounts or tailor it.",
                    "/accounting", _context.Accounts.AnyAsync(a => a.TenantId == tenantId)),
                await StepAsync("customers", "First customer", "Create a customer to start quoting and invoicing.",
                    "/clients", _context.Customers.AnyAsync(c => c.TenantId == tenantId && !c.IsSupplier && !c.IsDeleted)),
                await StepAsync("suppliers", "First supplier", "Add a supplier for purchase orders and bills.",
                    "/suppliers", _context.Customers.AnyAsync(c => c.TenantId == tenantId && c.IsSupplier && !c.IsDeleted)),
                await StepAsync("items", "First item", "Add a product or service with price and VAT.",
                    "/items", _context.Items.AnyAsync(i => i.TenantId == tenantId && !i.IsDeleted)),
                await StepAsync("quotation", "First quotation", "Send a priced quotation to a customer.",
                    "/quotations", _context.Quotations.AnyAsync(q => q.TenantId == tenantId && q.DocumentType == "Quotation")),
                await StepAsync("invoice", "First sales invoice", "Issue your first invoice and post it to the ledger.",
                    "/sell-invoices", _context.Invoices.AnyAsync(i => i.TenantId == tenantId && i.InvoiceType == "Sell" && i.DocumentType == "Invoice")),
                await StepAsync("tax", "Tax readiness", "Store your tax registration number for VAT and e-invoicing.",
                    "/settings", _context.Companies.AnyAsync(c => c.TenantId == tenantId && c.TaxNumber != null && c.TaxNumber != ""))
            };

            var completed = steps.Count(s => s.Completed);
            return ServiceResult<OnboardingProgressDto>.SuccessResult(new OnboardingProgressDto
            {
                Percent = steps.Count == 0 ? 0 : (int)Math.Round(completed * 100.0 / steps.Count),
                Completed = completed,
                Total = steps.Count,
                DemoDataLoaded = demoLoaded,
                Steps = steps
            });
        }

        public async Task<ServiceResult<DemoDataResultDto>> SeedDemoDataAsync()
        {
            var tenantId = TenantId;
            var exists = await _context.Customers
                .AnyAsync(c => c.TenantId == tenantId && c.Name.StartsWith("Demo -"));
            if (exists)
                return ServiceResult<DemoDataResultDto>.SuccessResult(new DemoDataResultDto
                {
                    AlreadyLoaded = true,
                    Message = "Demo data is already loaded for this workspace."
                });

            var result = new DemoDataResultDto();
            var alpha = await _customerService.CreateCustomerAsync(new CustomerCreateDto
            {
                Name = "Demo - Alpha Trading",
                Email = "alpha@demo.fatortak.test",
                Phone = "+201000000001",
                Address = "12 Demo Street, Cairo",
                PaymentTerms = "Net 30"
            });
            var beta = await _customerService.CreateCustomerAsync(new CustomerCreateDto
            {
                Name = "Demo - Beta Industries",
                Email = "beta@demo.fatortak.test",
                Phone = "+201000000002",
                Address = "8 Sample Road, Alexandria",
                PaymentTerms = "Net 15"
            });
            await _customerService.CreateCustomerAsync(new CustomerCreateDto
            {
                Name = "Demo - Delta Supplies",
                Email = "delta@demo.fatortak.test",
                Phone = "+201000000003",
                IsSupplier = true,
                PaymentTerms = "Net 30"
            });
            result.Customers = 3;

            var consulting = await _itemService.CreateItemAsync(new ItemCreateDto
            {
                Code = "DEMO-SVC-01",
                Name = "Demo - Consulting Hour",
                Description = "Advisory service used in the demo quotation.",
                Type = "service",
                UnitPrice = 450,
                PurchaseUnitPrice = 0,
                Unit = "hour",
                VatRate = 0.14m
            });
            var support = await _itemService.CreateItemAsync(new ItemCreateDto
            {
                Code = "DEMO-SVC-02",
                Name = "Demo - Support Plan",
                Description = "Monthly support retainer.",
                Type = "service",
                UnitPrice = 1200,
                PurchaseUnitPrice = 0,
                Unit = "month",
                VatRate = 0.14m
            });
            await _itemService.CreateItemAsync(new ItemCreateDto
            {
                Code = "DEMO-PRD-01",
                Name = "Demo - Office Chair",
                Description = "Ergonomic office chair.",
                Type = "product",
                UnitPrice = 900,
                PurchaseUnitPrice = 600,
                Unit = "pcs",
                VatRate = 0.14m,
                Quantity = 25
            });
            result.Items = 3;

            Guid? alphaId = alpha.Success ? alpha.Data.Id : null;
            if (alphaId.HasValue)
            {
                var project = new Project
                {
                    TenantId = tenantId,
                    Name = "Demo - Website Revamp",
                    Description = "Sample project for the onboarding tour.",
                    CustomerId = alphaId,
                    ContractValue = 24000,
                    PaymentTerms = "Net 30",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Projects.Add(project);
                await _context.SaveChangesAsync();
                result.Projects = 1;
            }

            if (alphaId.HasValue && consulting.Success && support.Success)
            {
                var quotation = await _quotationService.CreateQuotationAsync(new QuotationCreateDto
                {
                    CustomerId = alphaId.Value,
                    IssueDate = DateTime.UtcNow,
                    ValidUntil = DateTime.UtcNow.AddDays(30),
                    Status = "Draft",
                    Notes = "Demo quotation created by onboarding.",
                    Items = new List<QuotationItemCreateDto>
                    {
                        new()
                        {
                            ItemId = consulting.Data.Id,
                            Description = consulting.Data.Name,
                            Quantity = 10,
                            UnitPrice = consulting.Data.UnitPrice ?? 450,
                            VatRate = consulting.Data.VatRate ?? 0.14m
                        },
                        new()
                        {
                            ItemId = support.Data.Id,
                            Description = support.Data.Name,
                            Quantity = 1,
                            UnitPrice = support.Data.UnitPrice ?? 1200,
                            VatRate = support.Data.VatRate ?? 0.14m
                        }
                    }
                });
                if (quotation.Success) result.Quotations = 1;
            }

            result.Message = "Demo customers, suppliers, items, a project and a draft quotation were created.";
            return ServiceResult<DemoDataResultDto>.SuccessResult(result);
        }

        private static async Task<OnboardingStepDto> StepAsync(
            string key, string title, string description, string route, Task<bool> completed)
        {
            return new OnboardingStepDto
            {
                Key = key,
                Title = title,
                Description = description,
                Route = route,
                Completed = await completed
            };
        }

        private Guid TenantId =>
            (_httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant)?.Id ?? Guid.Empty;
    }
}

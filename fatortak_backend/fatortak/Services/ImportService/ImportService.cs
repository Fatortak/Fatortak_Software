using fatortak.Context;
using fatortak.Dtos.Customer;
using fatortak.Dtos.Import;
using fatortak.Dtos.Item;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Services.CustomerService;
using fatortak.Services.ItemService;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace fatortak.Services.ImportService
{
    public interface IImportService
    {
        Task<ServiceResult<ImportResultDto>> ImportCustomersAsync(CsvImportDto dto);
        Task<ServiceResult<ImportResultDto>> ImportItemsAsync(string csv);
    }

    public class ImportService : IImportService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICustomerService _customerService;
        private readonly IItemService _itemService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ImportService(
            ApplicationDbContext context,
            ICustomerService customerService,
            IItemService itemService,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _customerService = customerService;
            _itemService = itemService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<ImportResultDto>> ImportCustomersAsync(CsvImportDto dto)
        {
            var parsed = ParseCsv(dto.Csv);
            if (parsed.Rows.Count == 0)
                return ServiceResult<ImportResultDto>.Failure("The CSV file has no data rows.");

            var result = new ImportResultDto();
            foreach (var row in parsed.Rows)
            {
                var name = Get(row.Values, parsed.Header, "name");
                if (string.IsNullOrWhiteSpace(name))
                {
                    result.Failed++;
                    result.Errors.Add(new ImportRowErrorDto { Row = row.Line, Message = "Name is required." });
                    continue;
                }

                var isSupplier = dto.IsSupplier;
                var supplierValue = Get(row.Values, parsed.Header, "issupplier");
                if (bool.TryParse(supplierValue, out var parsedSupplier))
                    isSupplier = parsedSupplier;

                var email = Get(row.Values, parsed.Header, "email");
                var existing = await _context.Customers.AnyAsync(c =>
                    c.TenantId == TenantId &&
                    !c.IsDeleted &&
                    c.IsSupplier == isSupplier &&
                    (c.Name == name || (!string.IsNullOrEmpty(email) && c.Email == email)));
                if (existing)
                {
                    result.Skipped++;
                    continue;
                }

                var create = await _customerService.CreateCustomerAsync(new CustomerCreateDto
                {
                    Name = name.Trim(),
                    Email = email,
                    Phone = Get(row.Values, parsed.Header, "phone"),
                    Address = Get(row.Values, parsed.Header, "address"),
                    TaxNumber = Get(row.Values, parsed.Header, "taxnumber"),
                    VATNumber = Get(row.Values, parsed.Header, "vatnumber"),
                    PaymentTerms = Get(row.Values, parsed.Header, "paymentterms"),
                    IsSupplier = isSupplier,
                    Notes = Get(row.Values, parsed.Header, "notes")
                });

                if (create.Success)
                    result.Imported++;
                else
                {
                    result.Failed++;
                    result.Errors.Add(new ImportRowErrorDto
                    {
                        Row = row.Line,
                        Message = create.ErrorMessage ?? "Could not import the customer."
                    });
                }
            }

            return ServiceResult<ImportResultDto>.SuccessResult(result);
        }

        public async Task<ServiceResult<ImportResultDto>> ImportItemsAsync(string csv)
        {
            var parsed = ParseCsv(csv);
            if (parsed.Rows.Count == 0)
                return ServiceResult<ImportResultDto>.Failure("The CSV file has no data rows.");

            var result = new ImportResultDto();
            foreach (var row in parsed.Rows)
            {
                var name = Get(row.Values, parsed.Header, "name");
                if (string.IsNullOrWhiteSpace(name))
                {
                    result.Failed++;
                    result.Errors.Add(new ImportRowErrorDto { Row = row.Line, Message = "Name is required." });
                    continue;
                }

                var code = Get(row.Values, parsed.Header, "code");
                var existing = await _context.Items.AnyAsync(i =>
                    i.TenantId == TenantId &&
                    !i.IsDeleted &&
                    ((!string.IsNullOrEmpty(code) && i.Code == code) || i.Name == name));
                if (existing)
                {
                    result.Skipped++;
                    continue;
                }

                var type = Get(row.Values, parsed.Header, "type")?.ToLowerInvariant();
                var create = await _itemService.CreateItemAsync(new ItemCreateDto
                {
                    Name = name.Trim(),
                    Code = code,
                    Description = Get(row.Values, parsed.Header, "description"),
                    Type = type is "service" or "product" ? type : "product",
                    UnitPrice = ParseDecimal(Get(row.Values, parsed.Header, "unitprice")),
                    PurchaseUnitPrice = ParseDecimal(Get(row.Values, parsed.Header, "purchaseunitprice")),
                    Unit = Get(row.Values, parsed.Header, "unit") ?? "pcs",
                    VatRate = ParseDecimal(Get(row.Values, parsed.Header, "vatrate")),
                    Quantity = ParseInt(Get(row.Values, parsed.Header, "quantity"))
                });

                if (create.Success)
                    result.Imported++;
                else
                {
                    result.Failed++;
                    result.Errors.Add(new ImportRowErrorDto
                    {
                        Row = row.Line,
                        Message = create.ErrorMessage ?? "Could not import the item."
                    });
                }
            }

            return ServiceResult<ImportResultDto>.SuccessResult(result);
        }

        private Guid TenantId =>
            (_httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant)?.Id ?? Guid.Empty;

        private sealed record CsvRow(int Line, List<string> Values);
        private sealed record ParsedCsv(List<string> Header, List<CsvRow> Rows);

        private static ParsedCsv ParseCsv(string? csv)
        {
            var lines = (csv ?? string.Empty)
                .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                .ToList();
            if (lines.Count == 0) return new ParsedCsv(new List<string>(), new List<CsvRow>());

            var header = SplitLine(lines[0]).Select(h => h.Trim().ToLowerInvariant()).ToList();
            var hasHeader = header.Any(h => h is "name" or "code");
            var rows = new List<CsvRow>();
            var start = hasHeader ? 1 : 0;
            if (!hasHeader)
                header = new List<string> { "name", "email", "phone", "address" };

            for (var i = start; i < lines.Count; i++)
            {
                var values = SplitLine(lines[i]);
                if (values.All(string.IsNullOrWhiteSpace)) continue;
                rows.Add(new CsvRow(i + 1, values));
            }

            return new ParsedCsv(header, rows);
        }

        private static string? Get(List<string> values, List<string> header, string key)
        {
            var index = header.IndexOf(key);
            if (index < 0 || index >= values.Count) return null;
            var value = values[index].Trim();
            return string.IsNullOrEmpty(value) ? null : value;
        }

        private static List<string> SplitLine(string line)
        {
            var values = new List<string>();
            var current = new StringBuilder();
            var inQuotes = false;
            foreach (var ch in line)
            {
                if (ch == '"')
                {
                    inQuotes = !inQuotes;
                    continue;
                }
                if (ch == ',' && !inQuotes)
                {
                    values.Add(current.ToString());
                    current.Clear();
                    continue;
                }
                current.Append(ch);
            }
            values.Add(current.ToString());
            return values;
        }

        private static decimal? ParseDecimal(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return decimal.TryParse(value.Replace(",", ""), out var result) ? result : null;
        }

        private static int? ParseInt(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            return int.TryParse(value, out var result) ? result : null;
        }
    }
}

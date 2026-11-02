using fatortak.Context;
using fatortak.Dtos.Customer;
using fatortak.Dtos.Import;
using fatortak.Dtos.Item;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Services.CustomerService;
using fatortak.Services.ItemService;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;
using System.Text;
using System.Text.RegularExpressions;

namespace fatortak.Services.ImportService
{
    public interface IImportService
    {
        Task<ServiceResult<ImportPreviewDto>> PreviewAsync(
            IFormFile file, string entityType, bool isSupplier);
        Task<ServiceResult<ImportResultDto>> ExecuteAsync(ImportExecuteDto dto);
        Task<ServiceResult<ImportResultDto>> ImportCustomersAsync(CsvImportDto dto);
        Task<ServiceResult<ImportResultDto>> ImportItemsAsync(string csv);
    }

    public class ImportService : IImportService
    {
        private const int MaxRows = 5000;
        private const int PreviewRowLimit = MaxRows;
        private static readonly Regex EmailPattern =
            new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

        private static readonly Dictionary<string, string[]> CustomerAliases = new()
        {
            ["name"] = new[] { "name", "customername", "customer", "client", "clientname", "account", "accountname", "اسم", "اسم العميل", "العميل" },
            ["email"] = new[] { "email", "emailaddress", "mail", "customeremail", "البريد", "البريدالالكتروني" },
            ["phone"] = new[] { "phone", "phonenumber", "mobile", "mobilenumber", "tel", "telephone", "whatsapp", "الهاتف", "الجوال", "الموبايل" },
            ["address"] = new[] { "address", "billingaddress", "street", "location", "العنوان" },
            ["taxNumber"] = new[] { "taxnumber", "taxno", "taxid", "taxregistration", "tin", "رقمالضريبة", "الرقمالضريبي" },
            ["vatNumber"] = new[] { "vatnumber", "vatno", "vat", "vatid", "الرقمالضريبي", "ضريبةالقيمةالمضافة" },
            ["paymentTerms"] = new[] { "paymentterms", "terms", "creditterms", "netdays", "شروطالدفع" },
            ["notes"] = new[] { "notes", "note", "remarks", "comments", "ملاحظات" }
        };

        private static readonly Dictionary<string, string[]> ItemAliases = new()
        {
            ["code"] = new[] { "code", "sku", "itemcode", "productcode", "barcode", "reference", "الكود", "كودالصنف", "الباركود" },
            ["name"] = new[] { "name", "item", "itemname", "product", "productname", "اسم", "اسم الصنف", "الصنف" },
            ["description"] = new[] { "description", "details", "itemdescription", "الوصف", "التفاصيل" },
            ["type"] = new[] { "type", "itemtype", "producttype", "النوع" },
            ["unitPrice"] = new[] { "unitprice", "price", "saleprice", "sellingprice", "retailprice", "السعر", "سعرالبيع" },
            ["purchaseUnitPrice"] = new[] { "purchaseunitprice", "cost", "costprice", "purchaseprice", "buyprice", "التكلفة", "سعرالشراء" },
            ["unit"] = new[] { "unit", "uom", "measure", "الوحدة" },
            ["vatRate"] = new[] { "vatrate", "vat", "taxrate", "tax", "نسبةالضريبة", "الضريبة" },
            ["quantity"] = new[] { "quantity", "qty", "stock", "onhand", "openingstock", "الكمية", "الرصيد" }
        };

        private readonly ApplicationDbContext _context;
        private readonly ICustomerService _customerService;
        private readonly IItemService _itemService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ImportService(
            ApplicationDbContext context,
            ICustomerService customerService,
            IItemService itemService,
            IHttpContextAccessor httpContextAccessor,
            IConfiguration configuration)
        {
            _context = context;
            _customerService = customerService;
            _itemService = itemService;
            _httpContextAccessor = httpContextAccessor;

            var licenseKey = configuration["EPPlus:LicenseKey"];
            if (!string.IsNullOrWhiteSpace(licenseKey))
                ExcelPackage.License.SetCommercial(licenseKey);
            else
                ExcelPackage.License.SetNonCommercialOrganization(
                    configuration["EPPlus:Organization"] ?? "Fatortak");
        }

        public async Task<ServiceResult<ImportPreviewDto>> PreviewAsync(
            IFormFile file, string entityType, bool isSupplier)
        {
            if (file == null || file.Length == 0)
                return ServiceResult<ImportPreviewDto>.Failure("Choose a file to import.");
            if (file.Length > 10 * 1024 * 1024)
                return ServiceResult<ImportPreviewDto>.Failure("The file must be 10 MB or smaller.");

            entityType = NormalizeEntityType(entityType);
            if (entityType == null)
                return ServiceResult<ImportPreviewDto>.Failure("Choose customers or items to import.");

            ParsedTable table;
            try
            {
                table = await ParseFileAsync(file);
            }
            catch (Exception ex)
            {
                return ServiceResult<ImportPreviewDto>.Failure(
                    $"The file could not be read: {ex.Message}");
            }

            if (table.Headers.Count == 0 || table.Rows.Count == 0)
                return ServiceResult<ImportPreviewDto>.Failure(
                    "No rows were found. The first row must contain column headers.");

            var preview = new ImportPreviewDto
            {
                EntityType = entityType,
                Format = table.Format,
                FileName = file.FileName,
                Sheets = table.Sheets,
                SelectedSheet = table.SelectedSheet,
                Columns = table.Headers.Select(header => new ImportColumnDto
                {
                    Key = header,
                    Label = header,
                    Samples = table.Rows
                        .Select(row => row.Values.GetValueOrDefault(header, string.Empty))
                        .Where(value => !string.IsNullOrWhiteSpace(value))
                        .Distinct()
                        .Take(3)
                        .ToList()
                }).ToList(),
                SuggestedMapping = BuildSuggestedMapping(table.Headers, entityType),
                TotalRows = table.Rows.Count
            };

            if (table.Rows.Count > MaxRows)
                preview.Warnings.Add(
                    $"Only the first {MaxRows} rows are processed. Split larger files into batches.");

            var existing = await LoadExistingAsync(entityType, isSupplier);
            var seenNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in table.Rows.Take(MaxRows))
            {
                var validation = ValidateRow(
                    entityType, preview.SuggestedMapping, row.Values, isSupplier,
                    existing, seenNames, seenEmails, seenCodes);
                var previewRow = new ImportPreviewRowDto
                {
                    Row = row.Row,
                    Values = row.Values,
                    Errors = validation.Errors,
                    Duplicate = validation.Duplicate
                };
                preview.Rows.Add(previewRow);
                if (validation.Errors.Count > 0) preview.ErrorRows++;
                if (validation.Duplicate) preview.DuplicateRows++;
            }

            preview.ValidRows = Math.Max(0, preview.TotalRows - preview.ErrorRows - preview.DuplicateRows);
            if (preview.Rows.Count > PreviewRowLimit)
                preview.Rows = preview.Rows.Take(PreviewRowLimit).ToList();

            return ServiceResult<ImportPreviewDto>.SuccessResult(preview);
        }

        public async Task<ServiceResult<ImportResultDto>> ExecuteAsync(ImportExecuteDto dto)
        {
            var entityType = NormalizeEntityType(dto.EntityType);
            if (entityType == null)
                return ServiceResult<ImportResultDto>.Failure("Choose customers or items to import.");
            if (dto.Rows.Count == 0)
                return ServiceResult<ImportResultDto>.Failure("There are no rows to import.");
            if (dto.Rows.Count > MaxRows)
                return ServiceResult<ImportResultDto>.Failure(
                    $"A single import is limited to {MaxRows} rows. Split the file into batches.");

            var result = new ImportResultDto();
            var existing = await LoadExistingAsync(entityType, dto.IsSupplier);
            var seenNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var seenEmails = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in dto.Rows)
            {
                var validation = ValidateRow(
                    entityType, dto.Mapping, row.Values, dto.IsSupplier,
                    existing, seenNames, seenEmails, seenCodes);

                if (validation.Duplicate)
                {
                    result.Skipped++;
                    continue;
                }
                if (validation.Errors.Count > 0)
                {
                    result.Failed++;
                    result.Errors.Add(new ImportRowErrorDto
                    {
                        Row = row.Row,
                        Message = string.Join(" ", validation.Errors)
                    });
                    continue;
                }

                if (entityType == "customers")
                {
                    var create = await _customerService.CreateCustomerAsync(validation.Customer!);
                    if (create.Success) result.Imported++;
                    else
                    {
                        result.Failed++;
                        result.Errors.Add(new ImportRowErrorDto
                        {
                            Row = row.Row,
                            Message = create.ErrorMessage ?? "Could not import the customer."
                        });
                    }
                }
                else
                {
                    var create = await _itemService.CreateItemAsync(validation.Item!);
                    if (create.Success) result.Imported++;
                    else
                    {
                        result.Failed++;
                        result.Errors.Add(new ImportRowErrorDto
                        {
                            Row = row.Row,
                            Message = create.ErrorMessage ?? "Could not import the item."
                        });
                    }
                }
            }

            return ServiceResult<ImportResultDto>.SuccessResult(result);
        }

        public async Task<ServiceResult<ImportResultDto>> ImportCustomersAsync(CsvImportDto dto)
        {
            var parsed = ParseDelimited(dto.Csv, DetectDelimiter(dto.Csv));
            if (parsed.Rows.Count == 0)
                return ServiceResult<ImportResultDto>.Failure("The CSV file has no data rows.");

            var mapping = BuildSuggestedMapping(parsed.Headers, "customers");
            return await ExecuteAsync(new ImportExecuteDto
            {
                EntityType = "customers",
                IsSupplier = dto.IsSupplier,
                Mapping = mapping,
                Rows = parsed.Rows.Select(row => new ImportExecuteRowDto
                {
                    Row = row.Row,
                    Values = row.Values
                }).ToList()
            });
        }

        public async Task<ServiceResult<ImportResultDto>> ImportItemsAsync(string csv)
        {
            var parsed = ParseDelimited(csv, DetectDelimiter(csv));
            if (parsed.Rows.Count == 0)
                return ServiceResult<ImportResultDto>.Failure("The CSV file has no data rows.");

            return await ExecuteAsync(new ImportExecuteDto
            {
                EntityType = "items",
                Mapping = BuildSuggestedMapping(parsed.Headers, "items"),
                Rows = parsed.Rows.Select(row => new ImportExecuteRowDto
                {
                    Row = row.Row,
                    Values = row.Values
                }).ToList()
            });
        }

        private async Task<ParsedTable> ParseFileAsync(IFormFile file)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (extension is ".xlsx" or ".xlsm")
            {
                using var stream = new MemoryStream();
                await file.CopyToAsync(stream);
                stream.Position = 0;
                using var package = new ExcelPackage(stream);
                if (package.Workbook.Worksheets.Count == 0)
                    throw new InvalidOperationException("The workbook has no worksheets.");

                var sheet = package.Workbook.Worksheets[0];
                var headers = new List<string>();
                var rows = new List<ParsedRow>();
                if (sheet.Dimension == null)
                    return new ParsedTable("Excel", package.Workbook.Worksheets.Select(s => s.Name).ToList(), sheet.Name, headers, rows);

                for (var col = 1; col <= sheet.Dimension.End.Column; col++)
                {
                    var header = sheet.Cells[1, col].Text?.Trim();
                    headers.Add(UniqueHeader(headers, string.IsNullOrWhiteSpace(header) ? $"Column {col}" : header));
                }

                for (var rowNumber = 2; rowNumber <= Math.Min(sheet.Dimension.End.Row, MaxRows + 1); rowNumber++)
                {
                    var values = new Dictionary<string, string>();
                    var hasValue = false;
                    for (var col = 1; col <= headers.Count; col++)
                    {
                        var value = sheet.Cells[rowNumber, col].Text?.Trim() ?? string.Empty;
                        values[headers[col - 1]] = value;
                        if (!string.IsNullOrWhiteSpace(value)) hasValue = true;
                    }
                    if (hasValue) rows.Add(new ParsedRow(rowNumber, values));
                }

                return new ParsedTable(
                    "Excel",
                    package.Workbook.Worksheets.Select(s => s.Name).ToList(),
                    sheet.Name,
                    headers,
                    rows);
            }

            if (extension is ".xls")
                throw new InvalidOperationException(
                    "Legacy .xls files are not supported. Save the file as .xlsx or CSV.");

            using var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8, true);
            var text = await reader.ReadToEndAsync();
            var delimiter = DetectDelimiter(text);
            var parsed = ParseDelimited(text, delimiter);
            return new ParsedTable(
                extension is ".tsv" ? "TSV" : "CSV",
                new List<string>(),
                null,
                parsed.Headers,
                parsed.Rows);
        }

        private static ParsedTable ParseDelimited(string? text, char delimiter)
        {
            var rows = new List<List<string>>();
            var current = new List<string>();
            var field = new StringBuilder();
            var inQuotes = false;

            void CommitField()
            {
                current.Add(field.ToString().Trim());
                field.Clear();
            }

            void CommitRow()
            {
                if (current.Count > 0)
                {
                    rows.Add(new List<string>(current));
                    current.Clear();
                }
            }

            var source = text ?? string.Empty;
            for (var i = 0; i < source.Length; i++)
            {
                var ch = source[i];
                if (inQuotes)
                {
                    if (ch == '"')
                    {
                        if (i + 1 < source.Length && source[i + 1] == '"')
                        {
                            field.Append('"');
                            i++;
                        }
                        else inQuotes = false;
                    }
                    else field.Append(ch);
                    continue;
                }

                switch (ch)
                {
                    case '"':
                        inQuotes = true;
                        break;
                    case '\r':
                        break;
                    case '\n':
                        CommitField();
                        CommitRow();
                        break;
                    default:
                        if (ch == delimiter) CommitField();
                        else field.Append(ch);
                        break;
                }
            }
            if (field.Length > 0 || current.Count > 0)
            {
                CommitField();
                CommitRow();
            }

            rows = rows
                .Where(row => row.Any(value => !string.IsNullOrWhiteSpace(value)))
                .ToList();
            if (rows.Count == 0)
                return new ParsedTable("CSV", new List<string>(), null, new List<string>(), new List<ParsedRow>());

            var headers = new List<string>();
            foreach (var value in rows[0])
                headers.Add(UniqueHeader(headers, string.IsNullOrWhiteSpace(value) ? $"Column {headers.Count + 1}" : value.Trim()));

            var parsedRows = new List<ParsedRow>();
            for (var i = 1; i < rows.Count; i++)
            {
                var values = new Dictionary<string, string>();
                for (var col = 0; col < headers.Count; col++)
                    values[headers[col]] = col < rows[i].Count ? rows[i][col] : string.Empty;
                parsedRows.Add(new ParsedRow(i + 1, values));
            }

            return new ParsedTable("CSV", new List<string>(), null, headers, parsedRows);
        }

        private static char DetectDelimiter(string? text)
        {
            var firstLine = (text ?? string.Empty)
                .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault() ?? string.Empty;
            var candidates = new[] { ',', ';', '\t' };
            return candidates.OrderByDescending(c => firstLine.Count(ch => ch == c)).First();
        }

        private static string UniqueHeader(List<string> existing, string header)
        {
            var candidate = header.Trim();
            var index = 2;
            while (existing.Contains(candidate, StringComparer.OrdinalIgnoreCase))
                candidate = $"{header} ({index++})";
            return candidate;
        }

        private static Dictionary<string, string> BuildSuggestedMapping(
            IEnumerable<string> headers, string entityType)
        {
            var aliases = entityType == "items" ? ItemAliases : CustomerAliases;
            var mapping = new Dictionary<string, string>();
            var normalizedHeaders = headers
                .Select(header => new { Header = header, Key = NormalizeHeader(header) })
                .ToList();

            foreach (var (target, targetAliases) in aliases)
            {
                var exact = normalizedHeaders.FirstOrDefault(header =>
                    targetAliases.Any(alias =>
                        string.Equals(header.Key, NormalizeHeader(alias), StringComparison.OrdinalIgnoreCase)));
                if (exact != null)
                {
                    mapping[target] = exact.Header;
                    continue;
                }

                var partial = normalizedHeaders.FirstOrDefault(header =>
                    targetAliases.Any(alias =>
                    {
                        var key = NormalizeHeader(alias);
                        return key.Length >= 3 && header.Key.Contains(key);
                    }));
                if (partial != null) mapping[target] = partial.Header;
            }

            return mapping;
        }

        private static string NormalizeHeader(string value) =>
            new(value.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());

        private static string? NormalizeEntityType(string? value)
        {
            var normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
            return normalized is "customers" or "items" ? normalized : null;
        }

        private async Task<ExistingImportData> LoadExistingAsync(string entityType, bool isSupplier)
        {
            if (entityType == "customers")
            {
                var customers = await _context.Customers
                    .Where(c => c.TenantId == TenantId && !c.IsDeleted && c.IsSupplier == isSupplier)
                    .Select(c => new { c.Name, c.Email })
                    .ToListAsync();
                return new ExistingImportData(
                    new HashSet<string>(customers.Select(c => c.Name), StringComparer.OrdinalIgnoreCase),
                    new HashSet<string>(
                        customers.Where(c => !string.IsNullOrWhiteSpace(c.Email)).Select(c => c.Email!),
                        StringComparer.OrdinalIgnoreCase),
                    new HashSet<string>(StringComparer.OrdinalIgnoreCase));
            }
            else
            {
                var items = await _context.Items
                    .Where(i => i.TenantId == TenantId && !i.IsDeleted)
                    .Select(i => new { i.Name, i.Code })
                    .ToListAsync();
                return new ExistingImportData(
                    new HashSet<string>(items.Select(i => i.Name), StringComparer.OrdinalIgnoreCase),
                    new HashSet<string>(StringComparer.OrdinalIgnoreCase),
                    new HashSet<string>(
                        items.Where(i => !string.IsNullOrWhiteSpace(i.Code)).Select(i => i.Code!),
                        StringComparer.OrdinalIgnoreCase));
            }
        }

        private static RowValidation ValidateRow(
            string entityType,
            Dictionary<string, string> mapping,
            Dictionary<string, string> values,
            bool isSupplier,
            ExistingImportData existing,
            HashSet<string> seenNames,
            HashSet<string> seenEmails,
            HashSet<string> seenCodes)
        {
            return entityType == "customers"
                ? ValidateCustomer(mapping, values, isSupplier, existing, seenNames, seenEmails)
                : ValidateItem(mapping, values, existing, seenNames, seenCodes);
        }

        private static RowValidation ValidateCustomer(
            Dictionary<string, string> mapping,
            Dictionary<string, string> values,
            bool isSupplier,
            ExistingImportData existing,
            HashSet<string> seenNames,
            HashSet<string> seenEmails)
        {
            var errors = new List<string>();
            var name = GetMapped(values, mapping, "name");
            var email = GetMapped(values, mapping, "email");
            var phone = GetMapped(values, mapping, "phone");

            if (string.IsNullOrWhiteSpace(name))
                errors.Add("Name is required.");
            else if (name.Length > 200)
                errors.Add("Name must be 200 characters or fewer.");

            if (!string.IsNullOrWhiteSpace(email) && !EmailPattern.IsMatch(email))
                errors.Add("Email format is invalid.");

            if (!string.IsNullOrWhiteSpace(phone) && phone.Length > 40)
                errors.Add("Phone must be 40 characters or fewer.");

            var duplicate =
                (!string.IsNullOrWhiteSpace(name) &&
                 (existing.Names.Contains(name) || !seenNames.Add(name))) ||
                (!string.IsNullOrWhiteSpace(email) &&
                 (existing.Emails.Contains(email) || !seenEmails.Add(email)));

            return new RowValidation
            {
                Errors = errors,
                Duplicate = duplicate,
                Customer = errors.Count > 0 || duplicate ? null : new CustomerCreateDto
                {
                    Name = name!.Trim(),
                    Email = EmailOrNull(email),
                    Phone = StringOrNull(phone),
                    Address = StringOrNull(GetMapped(values, mapping, "address")),
                    TaxNumber = StringOrNull(GetMapped(values, mapping, "taxNumber")),
                    VATNumber = StringOrNull(GetMapped(values, mapping, "vatNumber")),
                    PaymentTerms = StringOrNull(GetMapped(values, mapping, "paymentTerms")),
                    Notes = StringOrNull(GetMapped(values, mapping, "notes")),
                    IsSupplier = isSupplier
                }
            };
        }

        private static RowValidation ValidateItem(
            Dictionary<string, string> mapping,
            Dictionary<string, string> values,
            ExistingImportData existing,
            HashSet<string> seenNames,
            HashSet<string> seenCodes)
        {
            var errors = new List<string>();
            var name = GetMapped(values, mapping, "name");
            var code = GetMapped(values, mapping, "code");
            var typeRaw = GetMapped(values, mapping, "type")?.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(name))
                errors.Add("Item name is required.");
            else if (name.Length > 200)
                errors.Add("Item name must be 200 characters or fewer.");

            var type = typeRaw switch
            {
                "service" or "خدمة" => "service",
                "product" or "منتج" => "product",
                null or "" => "product",
                _ => null
            };
            if (type == null)
                errors.Add("Type must be product or service.");

            var unitPrice = ParseDecimal(GetMapped(values, mapping, "unitPrice"), errors, "Sale price");
            var purchasePrice = ParseDecimal(GetMapped(values, mapping, "purchaseUnitPrice"), errors, "Cost price");
            var vatRate = ParseVatRate(GetMapped(values, mapping, "vatRate"), errors);
            var quantity = ParseInt(GetMapped(values, mapping, "quantity"), errors, "Quantity");

            if (unitPrice.HasValue && unitPrice < 0) errors.Add("Sale price cannot be negative.");
            if (purchasePrice.HasValue && purchasePrice < 0) errors.Add("Cost price cannot be negative.");
            if (quantity.HasValue && quantity < 0) errors.Add("Quantity cannot be negative.");
            if (!string.IsNullOrWhiteSpace(code) && code.Length > 80)
                errors.Add("Item code must be 80 characters or fewer.");

            var duplicate =
                (!string.IsNullOrWhiteSpace(name) &&
                 (existing.Names.Contains(name) || !seenNames.Add(name))) ||
                (!string.IsNullOrWhiteSpace(code) &&
                 (existing.Codes.Contains(code) || !seenCodes.Add(code)));

            return new RowValidation
            {
                Errors = errors,
                Duplicate = duplicate,
                Item = errors.Count > 0 || duplicate ? null : new ItemCreateDto
                {
                    Name = name!.Trim(),
                    Code = StringOrNull(code),
                    Description = StringOrNull(GetMapped(values, mapping, "description")),
                    Type = type!,
                    UnitPrice = unitPrice,
                    PurchaseUnitPrice = purchasePrice,
                    Unit = StringOrNull(GetMapped(values, mapping, "unit")) ?? "pcs",
                    VatRate = vatRate,
                    Quantity = quantity ?? 0
                }
            };
        }

        private static string? GetMapped(
            Dictionary<string, string> values,
            Dictionary<string, string> mapping,
            string target)
        {
            if (!mapping.TryGetValue(target, out var source) ||
                string.IsNullOrWhiteSpace(source))
                return null;
            return values.TryGetValue(source, out var value) && !string.IsNullOrWhiteSpace(value)
                ? value.Trim()
                : null;
        }

        private static decimal? ParseDecimal(string? value, List<string> errors, string label)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var cleaned = value.Replace(",", string.Empty).Replace("%", string.Empty).Trim();
            if (decimal.TryParse(cleaned, out var parsed)) return parsed;
            errors.Add($"{label} must be a number.");
            return null;
        }

        private static int? ParseInt(string? value, List<string> errors, string label)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            if (int.TryParse(value, out var parsed)) return parsed;
            errors.Add($"{label} must be a whole number.");
            return null;
        }

        private static decimal? ParseVatRate(string? value, List<string> errors)
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            var cleaned = value.Replace("%", string.Empty).Replace(",", string.Empty).Trim();
            if (!decimal.TryParse(cleaned, out var parsed))
            {
                errors.Add("VAT rate must be a number.");
                return null;
            }
            if (parsed > 1 && parsed <= 100) parsed /= 100;
            if (parsed < 0 || parsed > 1)
            {
                errors.Add("VAT rate must be between 0 and 100%.");
                return null;
            }
            return parsed;
        }

        private static string? EmailOrNull(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? StringOrNull(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private Guid TenantId =>
            (_httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant)?.Id ?? Guid.Empty;

        private sealed record ParsedRow(int Row, Dictionary<string, string> Values);
        private sealed record ParsedTable(
            string Format,
            List<string> Sheets,
            string? SelectedSheet,
            List<string> Headers,
            List<ParsedRow> Rows);
        private sealed record ExistingImportData(
            HashSet<string> Names,
            HashSet<string> Emails,
            HashSet<string> Codes);
        private sealed class RowValidation
        {
            public List<string> Errors { get; set; } = new();
            public bool Duplicate { get; set; }
            public CustomerCreateDto? Customer { get; set; }
            public ItemCreateDto? Item { get; set; }
        }
    }
}

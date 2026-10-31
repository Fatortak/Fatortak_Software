using fatortak.Common.Enum;
using fatortak.Context;
using fatortak.Dtos.Quotation;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace fatortak.Services.QuotationService
{
    public class QuotationService : IQuotationService
    {
        private const string QuotationPrefix = "QUO-";
        private readonly ApplicationDbContext _context;
        private readonly ILogger<QuotationService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public QuotationService(
            ApplicationDbContext context,
            ILogger<QuotationService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetCurrentTenantId();

        public async Task<ServiceResult<PagedResponseDto<QuotationDto>>> GetQuotationsAsync(
            QuotationFilterDto filter, PaginationDto pagination)
        {
            try
            {
                var query = _context.Quotations
                    .Where(q => q.TenantId == TenantId)
                    .AsQueryable();

                var documentType = string.IsNullOrWhiteSpace(filter.DocumentType)
                    ? "Quotation"
                    : filter.DocumentType;
                query = query.Where(q => q.DocumentType == documentType);

                if (!string.IsNullOrWhiteSpace(filter.Search))
                {
                    var term = filter.Search.ToLower();
                    query = query.Where(q =>
                        q.QuotationNumber.ToLower().Contains(term) ||
                        q.Customer.Name.ToLower().Contains(term) ||
                        (q.Notes != null && q.Notes.ToLower().Contains(term)));
                }

                if (filter.CustomerId.HasValue)
                    query = query.Where(q => q.CustomerId == filter.CustomerId.Value);

                if (!string.IsNullOrWhiteSpace(filter.Status))
                {
                    if (filter.Status == "Expired")
                    {
                        var today = DateTime.UtcNow.Date;
                        query = query.Where(q => q.ValidUntil.Date < today &&
                                                 (q.Status == "Draft" || q.Status == "Sent"));
                    }
                    else
                    {
                        query = query.Where(q => q.Status == filter.Status);
                    }
                }

                if (filter.FromDate.HasValue)
                    query = query.Where(q => q.IssueDate >= filter.FromDate.Value);

                if (filter.ToDate.HasValue)
                    query = query.Where(q => q.IssueDate <= filter.ToDate.Value);

                if (filter.BranchId.HasValue)
                    query = query.Where(q => q.BranchId == filter.BranchId.Value);

                if (filter.ProjectId.HasValue)
                    query = query.Where(q => q.ProjectId == filter.ProjectId.Value);

                var totalCount = await query.CountAsync();

                var stats = await query
                    .GroupBy(q => 1)
                    .Select(g => new
                    {
                        total = g.Count(),
                        draft = g.Count(q => q.Status == "Draft"),
                        sent = g.Count(q => q.Status == "Sent"),
                        accepted = g.Count(q => q.Status == "Accepted"),
                        converted = g.Count(q => q.Status == "Converted"),
                        confirmed = g.Count(q => q.Status == "Confirmed"),
                        invoiced = g.Count(q => q.Status == "Invoiced"),
                        rejected = g.Count(q => q.Status == "Rejected"),
                        totalAmount = g.Sum(q => q.Total)
                    })
                    .FirstOrDefaultAsync() ?? new
                    {
                        total = 0,
                        draft = 0,
                        sent = 0,
                        accepted = 0,
                        converted = 0,
                        confirmed = 0,
                        invoiced = 0,
                        rejected = 0,
                        totalAmount = 0m
                    };

                var quotations = await query
                    .Include(q => q.Customer)
                    .Include(q => q.Project)
                    .Include(q => q.Items)
                    .ThenInclude(i => i.Item)
                    .OrderByDescending(q => q.CreatedAt)
                    .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                    .Take(pagination.PageSize)
                    .ToListAsync();

                return ServiceResult<PagedResponseDto<QuotationDto>>.SuccessResult(
                    new PagedResponseDto<QuotationDto>
                    {
                        Data = quotations.Select(MapToDto).ToList(),
                        PageNumber = pagination.PageNumber,
                        PageSize = pagination.PageSize,
                        TotalCount = totalCount,
                        MetaData = stats
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving quotations");
                return ServiceResult<PagedResponseDto<QuotationDto>>.Failure("Failed to retrieve quotations");
            }
        }

        public async Task<ServiceResult<QuotationDto>> GetQuotationAsync(Guid quotationId)
        {
            var quotation = await GetWithRelations(quotationId);
            return quotation == null
                ? ServiceResult<QuotationDto>.Failure("Quotation not found")
                : ServiceResult<QuotationDto>.SuccessResult(MapToDto(quotation));
        }

        public async Task<ServiceResult<QuotationDto>> CreateQuotationAsync(QuotationCreateDto dto)
        {
            try
            {
                var validation = await ValidateAsync(dto.CustomerId, dto.ProjectId);
                if (validation != null)
                    return ServiceResult<QuotationDto>.Failure(validation);

                if (dto.Items == null || dto.Items.Count == 0)
                    return ServiceResult<QuotationDto>.Failure("At least one quotation item is required.");

                if (dto.ValidUntil.Date < dto.IssueDate.Date)
                    return ServiceResult<QuotationDto>.Failure("Valid until date cannot be before the issue date.");

                var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);
                if (company == null)
                    return ServiceResult<QuotationDto>.Failure("Company not found");

                var last = await _context.Quotations
                    .Where(q => q.TenantId == TenantId && q.DocumentType == "Quotation")
                    .OrderByDescending(q => q.CreatedAt)
                    .Select(q => q.QuotationNumber)
                    .FirstOrDefaultAsync();

                var number = string.IsNullOrWhiteSpace(dto.QuotationNumber)
                    ? GenerateNumber(last)
                    : dto.QuotationNumber!.Trim();

                if (await _context.Quotations.AnyAsync(q => q.TenantId == TenantId && q.QuotationNumber == number))
                    return ServiceResult<QuotationDto>.Failure("Quotation number already exists.");

                var quotation = new Quotation
                {
                    TenantId = TenantId,
                    QuotationNumber = number,
                    DocumentType = "Quotation",
                    CustomerId = dto.CustomerId,
                    BranchId = dto.BranchId,
                    ProjectId = dto.ProjectId,
                    IssueDate = dto.IssueDate,
                    ValidUntil = dto.ValidUntil,
                    Status = QuotationStatus.Draft.ToString(),
                    Currency = company.Currency,
                    Notes = dto.Notes,
                    Terms = dto.Terms,
                    AttachmentUrl = dto.AttachmentUrl,
                    UserId = TryGetUserId()
                };

                var (items, subtotal, vat, discount, total) = await BuildItems(dto.Items, company);
                quotation.Items = items;
                quotation.Subtotal = subtotal;
                quotation.VatAmount = vat;
                quotation.TotalDiscount = discount;
                quotation.Total = total;

                _context.Quotations.Add(quotation);
                await _context.SaveChangesAsync();

                var saved = await GetWithRelations(quotation.Id);
                return ServiceResult<QuotationDto>.SuccessResult(MapToDto(saved!));
            }
            catch (InvalidOperationException ex)
            {
                return ServiceResult<QuotationDto>.Failure(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating quotation");
                return ServiceResult<QuotationDto>.Failure("Failed to create quotation");
            }
        }

        public async Task<ServiceResult<QuotationDto>> UpdateQuotationAsync(Guid quotationId, QuotationUpdateDto dto)
        {
            try
            {
                var quotation = await GetWithRelations(quotationId);
                if (quotation == null)
                    return ServiceResult<QuotationDto>.Failure("Quotation not found");

                if (quotation.Status is "Converted" or "Cancelled")
                    return ServiceResult<QuotationDto>.Failure("Converted or cancelled quotations cannot be edited.");

                var validation = await ValidateAsync(dto.CustomerId, dto.ProjectId);
                if (validation != null)
                    return ServiceResult<QuotationDto>.Failure(validation);

                if (dto.Items == null || dto.Items.Count == 0)
                    return ServiceResult<QuotationDto>.Failure("At least one quotation item is required.");

                if (dto.ValidUntil.Date < dto.IssueDate.Date)
                    return ServiceResult<QuotationDto>.Failure("Valid until date cannot be before the issue date.");

                var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);
                if (company == null)
                    return ServiceResult<QuotationDto>.Failure("Company not found");

                var oldItems = quotation.Items.ToList();
                _context.QuotationItems.RemoveRange(oldItems);
                quotation.Items.Clear();

                var (items, subtotal, vat, discount, total) = await BuildItems(dto.Items, company);
                foreach (var item in items)
                {
                    item.QuotationId = quotation.Id;
                    _context.QuotationItems.Add(item);
                }

                quotation.CustomerId = dto.CustomerId;
                quotation.BranchId = dto.BranchId;
                quotation.ProjectId = dto.ProjectId;
                quotation.IssueDate = dto.IssueDate;
                quotation.ValidUntil = dto.ValidUntil;
                quotation.Notes = dto.Notes;
                quotation.Terms = dto.Terms;
                quotation.AttachmentUrl = dto.AttachmentUrl;
                quotation.Subtotal = subtotal;
                quotation.VatAmount = vat;
                quotation.TotalDiscount = discount;
                quotation.Total = total;
                quotation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                _context.ChangeTracker.Clear();
                var saved = await GetWithRelations(quotation.Id);
                return ServiceResult<QuotationDto>.SuccessResult(MapToDto(saved!));
            }
            catch (InvalidOperationException ex)
            {
                return ServiceResult<QuotationDto>.Failure(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quotation {QuotationId}", quotationId);
                return ServiceResult<QuotationDto>.Failure("Failed to update quotation");
            }
        }

        public async Task<ServiceResult<bool>> DeleteQuotationAsync(Guid quotationId)
        {
            try
            {
                var quotation = await GetWithRelations(quotationId);
                if (quotation == null)
                    return ServiceResult<bool>.Failure("Quotation not found");

                if (quotation.Status == "Converted")
                    return ServiceResult<bool>.Failure("Converted quotations cannot be deleted.");

                _context.Quotations.Remove(quotation);
                await _context.SaveChangesAsync();
                return ServiceResult<bool>.SuccessResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting quotation {QuotationId}", quotationId);
                return ServiceResult<bool>.Failure("Failed to delete quotation");
            }
        }

        public async Task<ServiceResult<QuotationDto>> UpdateStatusAsync(Guid quotationId, string status)
        {
            try
            {
                var quotation = await GetWithRelations(quotationId);
                if (quotation == null)
                    return ServiceResult<QuotationDto>.Failure("Quotation not found");

                if (!Enum.TryParse<QuotationStatus>(status, true, out var target))
                    return ServiceResult<QuotationDto>.Failure("Invalid quotation status.");

                if (target == QuotationStatus.Converted)
                    return ServiceResult<QuotationDto>.Failure("Use the convert action to convert a quotation.");

                if (quotation.Status is "Converted" or "Cancelled")
                    return ServiceResult<QuotationDto>.Failure("This quotation can no longer change status.");

                if (target == QuotationStatus.Expired && quotation.ValidUntil.Date >= DateTime.UtcNow.Date)
                    return ServiceResult<QuotationDto>.Failure("Only an expired quotation can be marked as expired.");

                if (target == QuotationStatus.Accepted && quotation.ValidUntil.Date < DateTime.UtcNow.Date)
                    return ServiceResult<QuotationDto>.Failure("An expired quotation cannot be accepted.");

                quotation.Status = target.ToString();
                quotation.UpdatedAt = DateTime.UtcNow;

                if (target == QuotationStatus.Sent && quotation.SentAt == null)
                    quotation.SentAt = DateTime.UtcNow;

                if (target == QuotationStatus.Accepted)
                    quotation.AcceptedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return ServiceResult<QuotationDto>.SuccessResult(MapToDto(quotation));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating quotation status {QuotationId}", quotationId);
                return ServiceResult<QuotationDto>.Failure("Failed to update quotation status");
            }
        }

        public async Task<ServiceResult<bool>> SendQuotationAsync(Guid quotationId)
        {
            try
            {
                var quotation = await GetWithRelations(quotationId);
                if (quotation == null)
                    return ServiceResult<bool>.Failure("Quotation not found");

                if (quotation.Status is "Converted" or "Cancelled" or "Rejected" or "Expired")
                    return ServiceResult<bool>.Failure("This quotation can no longer be sent.");

                if (quotation.Status == "Draft")
                {
                    quotation.Status = QuotationStatus.Sent.ToString();
                    quotation.SentAt = DateTime.UtcNow;
                    quotation.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return ServiceResult<bool>.SuccessResult(true);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending quotation {QuotationId}", quotationId);
                return ServiceResult<bool>.Failure("Failed to send quotation");
            }
        }

        public async Task<ServiceResult<QuotationDto>> DuplicateQuotationAsync(Guid quotationId)
        {
            try
            {
                var source = await GetWithRelations(quotationId);
                if (source == null)
                    return ServiceResult<QuotationDto>.Failure("Quotation not found");

                var last = await _context.Quotations
                    .Where(q => q.TenantId == TenantId && q.DocumentType == source.DocumentType)
                    .OrderByDescending(q => q.CreatedAt)
                    .Select(q => q.QuotationNumber)
                    .FirstOrDefaultAsync();

                var copy = new Quotation
                {
                    TenantId = TenantId,
                    QuotationNumber = GenerateNumberWithPrefix(
                        source.DocumentType == "SalesOrder" ? "SO-" :
                        source.DocumentType == "DeliveryNote" ? "DN-" : QuotationPrefix,
                        last),
                    DocumentType = source.DocumentType,
                    SourceQuotationId = source.SourceQuotationId,
                    CustomerId = source.CustomerId,
                    BranchId = source.BranchId,
                    ProjectId = source.ProjectId,
                    UserId = TryGetUserId(),
                    IssueDate = DateTime.UtcNow,
                    ValidUntil = DateTime.UtcNow.AddDays(30),
                    Status = QuotationStatus.Draft.ToString(),
                    Currency = source.Currency,
                    Notes = source.Notes,
                    Terms = source.Terms,
                    Subtotal = source.Subtotal,
                    VatAmount = source.VatAmount,
                    TotalDiscount = source.TotalDiscount,
                    Total = source.Total,
                    Items = source.Items.Select(i => new QuotationItem
                    {
                        TenantId = TenantId,
                        ItemId = i.ItemId,
                        Description = i.Description,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        VatRate = i.VatRate,
                        Discount = i.Discount,
                        LineTotal = i.LineTotal
                    }).ToList()
                };

                _context.Quotations.Add(copy);
                await _context.SaveChangesAsync();
                var saved = await GetWithRelations(copy.Id);
                return ServiceResult<QuotationDto>.SuccessResult(MapToDto(saved!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error duplicating quotation {QuotationId}", quotationId);
                return ServiceResult<QuotationDto>.Failure("Failed to duplicate quotation");
            }
        }

        public async Task<ServiceResult<QuotationDto>> ConvertToSalesOrderAsync(Guid quotationId)
        {
            try
            {
                var quotation = await GetWithRelations(quotationId);
                if (quotation == null)
                    return ServiceResult<QuotationDto>.Failure("Quotation not found");

                if (quotation.DocumentType != "Quotation")
                    return ServiceResult<QuotationDto>.Failure("Only a quotation can be converted to a sales order.");

                if (quotation.Status != "Accepted")
                    return ServiceResult<QuotationDto>.Failure("Accept the quotation before converting it to a sales order.");

                if (quotation.ValidUntil.Date < DateTime.UtcNow.Date)
                    return ServiceResult<QuotationDto>.Failure("This quotation has expired.");

                var exists = await _context.Quotations.AnyAsync(q =>
                    q.TenantId == TenantId &&
                    q.DocumentType == "SalesOrder" &&
                    q.SourceQuotationId == quotation.Id);
                if (exists)
                    return ServiceResult<QuotationDto>.Failure("A sales order already exists for this quotation.");

                var last = await _context.Quotations
                    .Where(q => q.TenantId == TenantId && q.DocumentType == "SalesOrder")
                    .OrderByDescending(q => q.CreatedAt)
                    .Select(q => q.QuotationNumber)
                    .FirstOrDefaultAsync();

                var order = new Quotation
                {
                    TenantId = TenantId,
                    QuotationNumber = GenerateNumberWithPrefix("SO-", last),
                    DocumentType = "SalesOrder",
                    SourceQuotationId = quotation.Id,
                    CustomerId = quotation.CustomerId,
                    BranchId = quotation.BranchId,
                    ProjectId = quotation.ProjectId,
                    UserId = TryGetUserId(),
                    IssueDate = DateTime.UtcNow,
                    ValidUntil = quotation.ValidUntil,
                    Status = "Confirmed",
                    ConfirmedAt = DateTime.UtcNow,
                    Currency = quotation.Currency,
                    Notes = quotation.Notes,
                    Terms = quotation.Terms,
                    Subtotal = quotation.Subtotal,
                    VatAmount = quotation.VatAmount,
                    TotalDiscount = quotation.TotalDiscount,
                    Total = quotation.Total,
                    Items = quotation.Items.Select(i => new QuotationItem
                    {
                        TenantId = TenantId,
                        ItemId = i.ItemId,
                        Description = i.Description,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        VatRate = i.VatRate,
                        Discount = i.Discount,
                        LineTotal = i.LineTotal
                    }).ToList()
                };

                _context.Quotations.Add(order);
                await _context.SaveChangesAsync();
                _context.ChangeTracker.Clear();
                var saved = await GetWithRelations(order.Id);
                return ServiceResult<QuotationDto>.SuccessResult(MapToDto(saved!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting quotation {QuotationId} to sales order", quotationId);
                return ServiceResult<QuotationDto>.Failure("Failed to create sales order");
            }
        }

        public async Task<ServiceResult<QuotationDto>> ConvertToDeliveryNoteAsync(Guid salesOrderId)
        {
            try
            {
                var order = await GetWithRelations(salesOrderId);
                if (order == null)
                    return ServiceResult<QuotationDto>.Failure("Sales order not found");

                if (order.DocumentType != "SalesOrder")
                    return ServiceResult<QuotationDto>.Failure("Only a sales order can produce a delivery note.");

                if (order.Status != "Confirmed")
                    return ServiceResult<QuotationDto>.Failure("Only a confirmed sales order can be delivered.");

                var exists = await _context.Quotations.AnyAsync(q =>
                    q.TenantId == TenantId &&
                    q.DocumentType == "DeliveryNote" &&
                    q.SourceQuotationId == order.Id);
                if (exists)
                    return ServiceResult<QuotationDto>.Failure("A delivery note already exists for this sales order.");

                var last = await _context.Quotations
                    .Where(q => q.TenantId == TenantId && q.DocumentType == "DeliveryNote")
                    .OrderByDescending(q => q.CreatedAt)
                    .Select(q => q.QuotationNumber)
                    .FirstOrDefaultAsync();

                var delivery = new Quotation
                {
                    TenantId = TenantId,
                    QuotationNumber = GenerateNumberWithPrefix("DN-", last),
                    DocumentType = "DeliveryNote",
                    SourceQuotationId = order.Id,
                    CustomerId = order.CustomerId,
                    BranchId = order.BranchId,
                    ProjectId = order.ProjectId,
                    UserId = TryGetUserId(),
                    IssueDate = DateTime.UtcNow,
                    ValidUntil = order.ValidUntil,
                    Status = "Delivered",
                    ConfirmedAt = DateTime.UtcNow,
                    Currency = order.Currency,
                    Notes = order.Notes,
                    Terms = order.Terms,
                    Subtotal = order.Subtotal,
                    VatAmount = order.VatAmount,
                    TotalDiscount = order.TotalDiscount,
                    Total = order.Total,
                    Items = order.Items.Select(i => new QuotationItem
                    {
                        TenantId = TenantId,
                        ItemId = i.ItemId,
                        Description = i.Description,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        VatRate = i.VatRate,
                        Discount = i.Discount,
                        LineTotal = i.LineTotal
                    }).ToList()
                };

                _context.Quotations.Add(delivery);
                await _context.SaveChangesAsync();
                _context.ChangeTracker.Clear();
                var saved = await GetWithRelations(delivery.Id);
                return ServiceResult<QuotationDto>.SuccessResult(MapToDto(saved!));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating delivery note for sales order {SalesOrderId}", salesOrderId);
                return ServiceResult<QuotationDto>.Failure("Failed to create delivery note");
            }
        }

        public async Task<ServiceResult<ConvertQuotationResultDto>> ConvertToInvoiceAsync(
            Guid quotationId, ConvertQuotationDto dto)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var quotation = await GetWithRelations(quotationId);
                if (quotation == null)
                    return ServiceResult<ConvertQuotationResultDto>.Failure("Quotation not found");

                if (quotation.ConvertedInvoiceId.HasValue ||
                    quotation.Status == "Converted" ||
                    quotation.Status == "Invoiced")
                    return ServiceResult<ConvertQuotationResultDto>.Failure("This document has already been converted.");

                if (quotation.Status is "Rejected" or "Cancelled")
                    return ServiceResult<ConvertQuotationResultDto>.Failure("Rejected or cancelled documents cannot be converted.");

                if (quotation.DocumentType == "SalesOrder" && quotation.Status != "Confirmed")
                    return ServiceResult<ConvertQuotationResultDto>.Failure("Only a confirmed sales order can be converted.");

                if (quotation.ValidUntil.Date < DateTime.UtcNow.Date)
                    return ServiceResult<ConvertQuotationResultDto>.Failure("This quotation has expired.");

                if (quotation.Items.Count == 0)
                    return ServiceResult<ConvertQuotationResultDto>.Failure("Quotation has no items.");

                var company = await _context.Companies.FirstOrDefaultAsync(c => c.TenantId == TenantId);
                if (company == null)
                    return ServiceResult<ConvertQuotationResultDto>.Failure("Company not found");

                var lastInvoice = await _context.Invoices
                    .Where(i => i.TenantId == TenantId && i.InvoiceType.ToLower() == "sell")
                    .OrderByDescending(i => i.CreatedAt)
                    .Select(i => i.InvoiceNumber)
                    .FirstOrDefaultAsync();

                var invoice = new Invoice
                {
                    TenantId = TenantId,
                    InvoiceNumber = GenerateInvoiceNumber(company.InvoicePrefix, lastInvoice),
                    CustomerId = quotation.CustomerId,
                    BranchId = quotation.BranchId,
                    ProjectId = quotation.ProjectId,
                    UserId = TryGetUserId(),
                    IssueDate = dto.IssueDate ?? DateTime.UtcNow,
                    DueDate = dto.DueDate ?? DateTime.UtcNow.AddDays(30),
                    Status = InvoiceStatus.Draft.ToString(),
                    InvoiceType = InvoiceTypes.Sell.ToString(),
                    Currency = quotation.Currency ?? company.Currency,
                    Notes = dto.Notes ?? quotation.Notes,
                    Terms = quotation.Terms,
                    Subtotal = quotation.Subtotal,
                    VatAmount = quotation.VatAmount,
                    TotalDiscount = quotation.TotalDiscount,
                    Total = quotation.Total,
                    InvoiceItems = quotation.Items.Select(i => new InvoiceItem
                    {
                        TenantId = TenantId,
                        ItemId = i.ItemId,
                        Description = i.Description,
                        Quantity = i.Quantity,
                        UnitPrice = i.UnitPrice,
                        VatRate = i.VatRate,
                        Discount = i.Discount,
                        LineTotal = i.LineTotal
                    }).ToList()
                };

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                quotation.Status = quotation.DocumentType == "SalesOrder"
                    ? "Invoiced"
                    : QuotationStatus.Converted.ToString();
                quotation.ConvertedAt = DateTime.UtcNow;
                quotation.ConvertedInvoiceId = invoice.Id;
                quotation.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return ServiceResult<ConvertQuotationResultDto>.SuccessResult(new ConvertQuotationResultDto
                {
                    InvoiceId = invoice.Id,
                    InvoiceNumber = invoice.InvoiceNumber,
                    Status = invoice.Status
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error converting quotation {QuotationId}", quotationId);
                return ServiceResult<ConvertQuotationResultDto>.Failure("Failed to convert quotation");
            }
        }

        private async Task<Quotation?> GetWithRelations(Guid id) =>
            await _context.Quotations
                .Include(q => q.Customer)
                .Include(q => q.Project)
                .Include(q => q.Items)
                .ThenInclude(i => i.Item)
                .FirstOrDefaultAsync(q => q.Id == id && q.TenantId == TenantId);

        private async Task<string?> ValidateAsync(Guid customerId, Guid? projectId)
        {
            if (customerId == Guid.Empty)
                return "Customer is required.";

            if (!await _context.Customers.AnyAsync(c => c.Id == customerId && c.TenantId == TenantId))
                return "Customer not found";

            if (projectId.HasValue)
            {
                var project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.Id == projectId.Value && p.TenantId == TenantId);
                if (project == null)
                    return "Project not found.";
                if (project.Status is ProjectStatus.Completed or ProjectStatus.Cancelled)
                    return $"Cannot create a quotation for a {project.Status.ToString().ToLower()} project.";
            }

            return null;
        }

        private async Task<(List<QuotationItem> Items, decimal Subtotal, decimal Vat, decimal Discount, decimal Total)>
            BuildItems(List<QuotationItemCreateDto> dtos, Company company)
        {
            var items = new List<QuotationItem>();
            foreach (var dto in dtos)
            {
                if (dto.Quantity <= 0)
                    throw new InvalidOperationException("Item quantity must be greater than zero.");
                if (dto.UnitPrice < 0)
                    throw new InvalidOperationException("Item price cannot be negative.");

                var item = dto.ItemId.HasValue
                    ? await _context.Items.FirstOrDefaultAsync(i => i.Id == dto.ItemId.Value && i.TenantId == TenantId)
                    : null;

                var unitPrice = dto.UnitPrice > 0 ? dto.UnitPrice : item?.UnitPrice ?? 0;
                var vatRate = dto.VatRate.HasValue && dto.VatRate.Value > 0
                    ? dto.VatRate.Value
                    : item?.VatRate ?? company.DefaultVatRate;
                var discount = Math.Clamp(dto.Discount, 0, 1);
                var net = dto.Quantity * unitPrice * (1 - discount);

                items.Add(new QuotationItem
                {
                    TenantId = TenantId,
                    ItemId = item?.Id,
                    Description = dto.Description ?? item?.Name ?? "Item",
                    Quantity = dto.Quantity,
                    UnitPrice = unitPrice,
                    VatRate = vatRate,
                    Discount = discount,
                    LineTotal = net + net * vatRate
                });
            }

            var subtotal = items.Sum(i => i.Quantity * i.UnitPrice);
            var discountTotal = items.Sum(i => i.Quantity * i.UnitPrice * i.Discount);
            var vat = items.Sum(i => i.Quantity * i.UnitPrice * (1 - i.Discount) * (i.VatRate ?? 0));
            var total = subtotal + vat - discountTotal;
            return (items, subtotal, vat, discountTotal, total);
        }

        private QuotationDto MapToDto(Quotation quotation)
        {
            var today = DateTime.UtcNow.Date;
            var isExpired = quotation.ValidUntil.Date < today &&
                            quotation.Status is "Draft" or "Sent";
            return new QuotationDto
            {
                Id = quotation.Id,
                QuotationNumber = quotation.QuotationNumber,
                DocumentType = quotation.DocumentType,
                SourceQuotationId = quotation.SourceQuotationId,
                CustomerId = quotation.CustomerId,
                CustomerName = quotation.Customer?.Name,
                CustomerPhoneNumber = quotation.Customer?.Phone,
                BranchId = quotation.BranchId,
                ProjectId = quotation.ProjectId,
                ProjectName = quotation.Project?.Name,
                IssueDate = quotation.IssueDate,
                ValidUntil = quotation.ValidUntil,
                Status = isExpired ? QuotationStatus.Expired.ToString() : quotation.Status,
                Subtotal = quotation.Subtotal,
                VatAmount = quotation.VatAmount,
                TotalDiscount = quotation.TotalDiscount,
                Total = quotation.Total,
                Currency = quotation.Currency,
                Notes = quotation.Notes,
                Terms = quotation.Terms,
                AttachmentUrl = quotation.AttachmentUrl,
                CreatedAt = quotation.CreatedAt,
                SentAt = quotation.SentAt,
                AcceptedAt = quotation.AcceptedAt,
                ConfirmedAt = quotation.ConfirmedAt,
                ConvertedAt = quotation.ConvertedAt,
                ConvertedInvoiceId = quotation.ConvertedInvoiceId,
                DaysUntilExpiry = (quotation.ValidUntil.Date - today).Days,
                IsExpired = isExpired,
                Items = quotation.Items.Select(i => new QuotationItemDto
                {
                    Id = i.Id,
                    ItemId = i.ItemId,
                    ItemName = i.Item?.Name ?? string.Empty,
                    Description = i.Description,
                    Quantity = i.Quantity,
                    UnitPrice = i.UnitPrice,
                    VatRate = i.VatRate,
                    Discount = i.Discount,
                    LineTotal = i.LineTotal
                }).ToList()
            };
        }

        private static string GenerateNumber(string? lastNumber)
        {
            var match = Regex.Match(lastNumber ?? string.Empty, @"\d+$");
            if (match.Success && long.TryParse(match.Value, out var number))
                return $"{QuotationPrefix}{(number + 1).ToString().PadLeft(4, '0')}";
            return $"{QuotationPrefix}0001";
        }

        private static string GenerateNumberWithPrefix(string prefix, string? lastNumber)
        {
            if (string.IsNullOrEmpty(lastNumber))
                return $"{prefix}0001";

            var match = Regex.Match(lastNumber, @"\d+$");
            if (match.Success && long.TryParse(match.Value, out var number))
            {
                var numberPrefix = lastNumber[..match.Index];
                var next = number + 1;
                return $"{numberPrefix}{next.ToString().PadLeft(match.Value.Length, '0')}";
            }

            return $"{prefix}0001";
        }

        private static string GenerateInvoiceNumber(string? prefix, string? lastNumber)
        {
            if (string.IsNullOrEmpty(lastNumber))
                return $"{prefix}0001";

            var match = Regex.Match(lastNumber, @"\d+$");
            if (match.Success && long.TryParse(match.Value, out var number))
            {
                var prefixPart = lastNumber[..match.Index];
                return $"{prefixPart}{(number + 1).ToString().PadLeft(match.Value.Length, '0')}";
            }

            return $"{prefix}0001";
        }

        private Guid? TryGetUserId()
        {
            var raw = UserHelper.GetUserId();
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private Guid GetCurrentTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}

using fatortak.Context;
using fatortak.Dtos.Approval;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using fatortak.Helpers;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.ApprovalService
{
    public interface IApprovalService
    {
        Task<ServiceResult<PagedResponseDto<ApprovalRequestDto>>> GetAsync(ApprovalRequestFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<ApprovalRequestDto>> GetAsync(Guid id);
        Task<ServiceResult<List<ApprovalCandidateDto>>> GetCandidatesAsync(string documentType);
        Task<ServiceResult<ApprovalRequestDto>> CreateAsync(ApprovalRequestCreateDto dto);
        Task<ServiceResult<ApprovalRequestDto>> ApproveAsync(Guid id, ApprovalDecisionDto dto);
        Task<ServiceResult<ApprovalRequestDto>> RejectAsync(Guid id, ApprovalDecisionDto dto);
        Task<ServiceResult<ApprovalRequestDto>> CancelAsync(Guid id);
        Task<ServiceResult<List<ApprovalPolicyDto>>> GetPoliciesAsync();
        Task<ServiceResult<ApprovalPolicyDto>> SavePolicyAsync(ApprovalPolicyUpdateDto dto);
    }

    public class ApprovalService : IApprovalService
    {
        public static readonly string[] DocumentTypes =
        {
            "Invoice", "Quotation", "PurchaseOrder", "Expense", "CreditNote", "Payment", "Discount"
        };

        private readonly ApplicationDbContext _context;
        private readonly ILogger<ApprovalService> _logger;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ApprovalService(
            ApplicationDbContext context,
            ILogger<ApprovalService> logger,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
        }

        private Guid TenantId => GetTenantId();

        public async Task<ServiceResult<PagedResponseDto<ApprovalRequestDto>>> GetAsync(
            ApprovalRequestFilterDto filter, PaginationDto pagination)
        {
            var query = _context.ApprovalRequests
                .Where(a => a.TenantId == TenantId)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                var term = filter.Search.Trim().ToLower();
                query = query.Where(a =>
                    a.DocumentNumber.ToLower().Contains(term) ||
                    a.DocumentType.ToLower().Contains(term) ||
                    (a.Notes != null && a.Notes.ToLower().Contains(term)));
            }
            if (!string.IsNullOrWhiteSpace(filter.Status))
                query = query.Where(a => a.Status == filter.Status);
            if (!string.IsNullOrWhiteSpace(filter.DocumentType))
                query = query.Where(a => a.DocumentType == filter.DocumentType);
            if (filter.FromDate.HasValue)
                query = query.Where(a => a.RequestedAt >= filter.FromDate.Value);
            if (filter.ToDate.HasValue)
                query = query.Where(a => a.RequestedAt <= filter.ToDate.Value);

            var total = await query.CountAsync();
            var stats = new
            {
                total,
                pending = await query.CountAsync(a => a.Status == "Pending"),
                approved = await query.CountAsync(a => a.Status == "Approved"),
                rejected = await query.CountAsync(a => a.Status == "Rejected"),
                cancelled = await query.CountAsync(a => a.Status == "Cancelled"),
                pendingValue = await query.Where(a => a.Status == "Pending").SumAsync(a => a.Amount)
            };

            var requests = await query
                .Include(a => a.RequestedByUser)
                .Include(a => a.DecidedByUser)
                .OrderByDescending(a => a.RequestedAt)
                .Skip((pagination.PageNumber - 1) * pagination.PageSize)
                .Take(pagination.PageSize)
                .ToListAsync();

            return ServiceResult<PagedResponseDto<ApprovalRequestDto>>.SuccessResult(
                new PagedResponseDto<ApprovalRequestDto>
                {
                    Data = requests.Select(Map).ToList(),
                    PageNumber = pagination.PageNumber,
                    PageSize = pagination.PageSize,
                    TotalCount = total,
                    MetaData = stats
                });
        }

        public async Task<ServiceResult<ApprovalRequestDto>> GetAsync(Guid id)
        {
            var request = await BaseQuery().FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
            return request == null
                ? ServiceResult<ApprovalRequestDto>.Failure("Approval request not found")
                : ServiceResult<ApprovalRequestDto>.SuccessResult(Map(request));
        }

        public async Task<ServiceResult<List<ApprovalCandidateDto>>> GetCandidatesAsync(string documentType)
        {
            var type = NormalizeType(documentType);
            if (type == null)
                return ServiceResult<List<ApprovalCandidateDto>>.Failure("Unsupported document type.");

            var existing = await _context.ApprovalRequests
                .Where(a => a.TenantId == TenantId &&
                            a.DocumentType == type &&
                            a.Status == "Pending")
                .Select(a => a.DocumentId)
                .ToListAsync();
            var existingSet = existing.ToHashSet();

            var candidates = await LoadCandidatesAsync(type, 100);
            return ServiceResult<List<ApprovalCandidateDto>>.SuccessResult(
                candidates.Where(c => !existingSet.Contains(c.DocumentId)).ToList());
        }

        public async Task<ServiceResult<ApprovalRequestDto>> CreateAsync(ApprovalRequestCreateDto dto)
        {
            var type = NormalizeType(dto.DocumentType);
            if (type == null)
                return ServiceResult<ApprovalRequestDto>.Failure("Unsupported document type.");
            if (string.IsNullOrWhiteSpace(dto.DocumentId))
                return ServiceResult<ApprovalRequestDto>.Failure("Choose a document to approve.");

            var candidate = (await LoadCandidatesAsync(type, 500))
                .FirstOrDefault(c => c.DocumentId == dto.DocumentId);
            if (candidate == null)
                return ServiceResult<ApprovalRequestDto>.Failure("The selected document could not be found.");

            var duplicate = await _context.ApprovalRequests.AnyAsync(a =>
                a.TenantId == TenantId &&
                a.DocumentType == type &&
                a.DocumentId == dto.DocumentId &&
                a.Status == "Pending");
            if (duplicate)
                return ServiceResult<ApprovalRequestDto>.Failure("This document is already waiting for approval.");

            var policy = await _context.ApprovalPolicies
                .FirstOrDefaultAsync(p => p.TenantId == TenantId && p.DocumentType == type);
            var autoApprove = policy != null &&
                (!policy.IsEnabled || (policy.ThresholdAmount > 0 && Math.Abs(candidate.Amount) < policy.ThresholdAmount));

            var request = new ApprovalRequest
            {
                TenantId = TenantId,
                DocumentType = type,
                DocumentId = candidate.DocumentId,
                DocumentNumber = candidate.DocumentNumber,
                Amount = candidate.Amount,
                Notes = dto.Notes,
                Status = autoApprove ? "Approved" : "Pending",
                RequestedByUserId = TryGetUserId(),
                DecidedByUserId = autoApprove ? TryGetUserId() : null,
                DecidedAt = autoApprove ? DateTime.UtcNow : null,
                DecisionNotes = autoApprove
                    ? policy?.IsEnabled == false
                        ? "Auto-approved: approvals are disabled for this document type."
                        : "Auto-approved: amount is below the configured threshold."
                    : null
            };

            _context.ApprovalRequests.Add(request);
            await _context.SaveChangesAsync();
            return await GetAsync(request.Id);
        }

        public async Task<ServiceResult<ApprovalRequestDto>> ApproveAsync(Guid id, ApprovalDecisionDto dto)
        {
            var request = await BaseQuery().FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
            if (request == null)
                return ServiceResult<ApprovalRequestDto>.Failure("Approval request not found");
            if (request.Status != "Pending")
                return ServiceResult<ApprovalRequestDto>.Failure("Only pending requests can be approved.");
            if (!await IsApproverAsync())
                return ServiceResult<ApprovalRequestDto>.Failure("Only an administrator can approve requests.");

            request.Status = "Approved";
            request.DecidedByUserId = TryGetUserId();
            request.DecidedAt = DateTime.UtcNow;
            request.DecisionNotes = dto.Notes;
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<ApprovalRequestDto>> RejectAsync(Guid id, ApprovalDecisionDto dto)
        {
            var request = await BaseQuery().FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
            if (request == null)
                return ServiceResult<ApprovalRequestDto>.Failure("Approval request not found");
            if (request.Status != "Pending")
                return ServiceResult<ApprovalRequestDto>.Failure("Only pending requests can be rejected.");
            if (!await IsApproverAsync())
                return ServiceResult<ApprovalRequestDto>.Failure("Only an administrator can reject requests.");
            if (string.IsNullOrWhiteSpace(dto.Notes))
                return ServiceResult<ApprovalRequestDto>.Failure("A rejection reason is required.");

            request.Status = "Rejected";
            request.DecidedByUserId = TryGetUserId();
            request.DecidedAt = DateTime.UtcNow;
            request.DecisionNotes = dto.Notes;
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<ApprovalRequestDto>> CancelAsync(Guid id)
        {
            var request = await BaseQuery().FirstOrDefaultAsync(a => a.Id == id && a.TenantId == TenantId);
            if (request == null)
                return ServiceResult<ApprovalRequestDto>.Failure("Approval request not found");
            if (request.Status != "Pending")
                return ServiceResult<ApprovalRequestDto>.Failure("Only pending requests can be cancelled.");

            request.Status = "Cancelled";
            request.DecidedByUserId = TryGetUserId();
            request.DecidedAt = DateTime.UtcNow;
            request.DecisionNotes = "Cancelled by requester";
            await _context.SaveChangesAsync();
            return await GetAsync(id);
        }

        public async Task<ServiceResult<List<ApprovalPolicyDto>>> GetPoliciesAsync()
        {
            var policies = await _context.ApprovalPolicies
                .Where(p => p.TenantId == TenantId)
                .ToListAsync();

            return ServiceResult<List<ApprovalPolicyDto>>.SuccessResult(
                DocumentTypes.Select(type =>
                {
                    var policy = policies.FirstOrDefault(p => p.DocumentType == type);
                    return new ApprovalPolicyDto
                    {
                        DocumentType = type,
                        ThresholdAmount = policy?.ThresholdAmount ?? 0,
                        IsEnabled = policy?.IsEnabled ?? true
                    };
                }).ToList());
        }

        public async Task<ServiceResult<ApprovalPolicyDto>> SavePolicyAsync(ApprovalPolicyUpdateDto dto)
        {
            var type = NormalizeType(dto.DocumentType);
            if (type == null)
                return ServiceResult<ApprovalPolicyDto>.Failure("Unsupported document type.");
            if (dto.ThresholdAmount < 0)
                return ServiceResult<ApprovalPolicyDto>.Failure("Threshold cannot be negative.");

            var policy = await _context.ApprovalPolicies
                .FirstOrDefaultAsync(p => p.TenantId == TenantId && p.DocumentType == type);
            if (policy == null)
            {
                policy = new ApprovalPolicy { TenantId = TenantId, DocumentType = type };
                _context.ApprovalPolicies.Add(policy);
            }

            policy.ThresholdAmount = dto.ThresholdAmount;
            policy.IsEnabled = dto.IsEnabled;
            policy.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return ServiceResult<ApprovalPolicyDto>.SuccessResult(new ApprovalPolicyDto
            {
                DocumentType = policy.DocumentType,
                ThresholdAmount = policy.ThresholdAmount,
                IsEnabled = policy.IsEnabled
            });
        }

        private async Task<List<ApprovalCandidateDto>> LoadCandidatesAsync(string type, int take)
        {
            switch (type)
            {
                case "Invoice":
                    return await _context.Invoices
                        .Where(i => i.TenantId == TenantId && i.DocumentType == "Invoice")
                        .OrderByDescending(i => i.CreatedAt)
                        .Take(take)
                        .Select(i => new ApprovalCandidateDto
                        {
                            DocumentType = type,
                            DocumentId = i.Id.ToString(),
                            DocumentNumber = i.InvoiceNumber,
                            PartyName = i.Customer.Name,
                            Amount = i.Total,
                            Date = i.IssueDate
                        }).ToListAsync();

                case "Quotation":
                    return await _context.Quotations
                        .Where(q => q.TenantId == TenantId && q.DocumentType == "Quotation")
                        .OrderByDescending(q => q.CreatedAt)
                        .Take(take)
                        .Select(q => new ApprovalCandidateDto
                        {
                            DocumentType = type,
                            DocumentId = q.Id.ToString(),
                            DocumentNumber = q.QuotationNumber,
                            PartyName = q.Customer.Name,
                            Amount = q.Total,
                            Date = q.IssueDate
                        }).ToListAsync();

                case "PurchaseOrder":
                    return await _context.PurchaseOrders
                        .Where(p => p.TenantId == TenantId)
                        .OrderByDescending(p => p.CreatedAt)
                        .Take(take)
                        .Select(p => new ApprovalCandidateDto
                        {
                            DocumentType = type,
                            DocumentId = p.Id.ToString(),
                            DocumentNumber = p.PoNumber,
                            PartyName = p.Supplier.Name,
                            Amount = p.Total,
                            Date = p.IssueDate
                        }).ToListAsync();

                case "Expense":
                    return await _context.Expenses
                        .Where(e => e.TenantId == TenantId)
                        .OrderByDescending(e => e.CreatedAt)
                        .Take(take)
                        .Select(e => new ApprovalCandidateDto
                        {
                            DocumentType = type,
                            DocumentId = e.Id.ToString(),
                            DocumentNumber = $"EXP-{e.Id}",
                            PartyName = e.Category != null ? e.Category.Name : null,
                            Amount = e.Total,
                            Date = e.CreatedAt
                        }).ToListAsync();

                case "CreditNote":
                    return await _context.Invoices
                        .Where(i => i.TenantId == TenantId &&
                                    (i.DocumentType == "CreditNote" || i.DocumentType == "DebitNote"))
                        .OrderByDescending(i => i.CreatedAt)
                        .Take(take)
                        .Select(i => new ApprovalCandidateDto
                        {
                            DocumentType = type,
                            DocumentId = i.Id.ToString(),
                            DocumentNumber = i.InvoiceNumber,
                            PartyName = i.Customer.Name,
                            Amount = i.Total,
                            Date = i.IssueDate
                        }).ToListAsync();

                case "Payment":
                    return await _context.Transactions
                        .Where(t => t.TenantId == TenantId)
                        .OrderByDescending(t => t.TransactionDate)
                        .Take(take)
                        .Select(t => new ApprovalCandidateDto
                        {
                            DocumentType = type,
                            DocumentId = t.Id.ToString(),
                            DocumentNumber = t.Description ?? $"TXN-{t.Id}",
                            PartyName = t.PaymentMethod,
                            Amount = t.Amount,
                            Date = t.TransactionDate
                        }).ToListAsync();

                case "Discount":
                    return await _context.Invoices
                        .Where(i => i.TenantId == TenantId &&
                                    i.DocumentType == "Invoice" &&
                                    i.TotalDiscount > 0)
                        .OrderByDescending(i => i.CreatedAt)
                        .Take(take)
                        .Select(i => new ApprovalCandidateDto
                        {
                            DocumentType = type,
                            DocumentId = i.Id.ToString(),
                            DocumentNumber = $"DSC-{i.InvoiceNumber}",
                            PartyName = i.Customer.Name,
                            Amount = i.TotalDiscount,
                            Date = i.IssueDate
                        }).ToListAsync();

                default:
                    return new List<ApprovalCandidateDto>();
            }
        }

        private IQueryable<ApprovalRequest> BaseQuery() =>
            _context.ApprovalRequests
                .Include(a => a.RequestedByUser)
                .Include(a => a.DecidedByUser);

        private static string? NormalizeType(string? documentType)
        {
            if (string.IsNullOrWhiteSpace(documentType)) return null;
            return DocumentTypes.FirstOrDefault(t =>
                t.Equals(documentType.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        private static ApprovalRequestDto Map(ApprovalRequest request) => new()
        {
            Id = request.Id,
            DocumentType = request.DocumentType,
            DocumentId = request.DocumentId,
            DocumentNumber = request.DocumentNumber,
            Amount = request.Amount,
            Notes = request.Notes,
            Status = request.Status,
            RequestedByName = request.RequestedByUser == null
                ? null
                : $"{request.RequestedByUser.FirstName} {request.RequestedByUser.LastName}".Trim(),
            RequestedAt = request.RequestedAt,
            DecidedByName = request.DecidedByUser == null
                ? null
                : $"{request.DecidedByUser.FirstName} {request.DecidedByUser.LastName}".Trim(),
            DecidedAt = request.DecidedAt,
            DecisionNotes = request.DecisionNotes
        };

        private Guid? TryGetUserId()
        {
            var raw = UserHelper.GetUserId();
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private async Task<bool> IsApproverAsync()
        {
            var userId = TryGetUserId();
            if (!userId.HasValue) return false;
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            return user?.Role == "Admin" || user?.Role == "SysAdmin";
        }

        private Guid GetTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}

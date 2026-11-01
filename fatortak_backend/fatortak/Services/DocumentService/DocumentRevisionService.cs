using fatortak.Context;
using fatortak.Dtos.Documents;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Services.DocumentService
{
    public interface IDocumentRevisionService
    {
        Task<ServiceResult<List<DocumentRevisionDto>>> GetRevisionsAsync(
            string documentType, Guid documentId);
    }

    public class DocumentRevisionService : IDocumentRevisionService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DocumentRevisionService(
            ApplicationDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ServiceResult<List<DocumentRevisionDto>>> GetRevisionsAsync(
            string documentType, Guid documentId)
        {
            var tenantId = GetTenantId();
            var revisions = await _context.DocumentRevisions
                .Include(r => r.User)
                .Where(r => r.TenantId == tenantId &&
                            r.DocumentType == documentType &&
                            r.DocumentId == documentId)
                .OrderByDescending(r => r.Revision)
                .Select(r => new DocumentRevisionDto
                {
                    Id = r.Id,
                    DocumentType = r.DocumentType,
                    DocumentId = r.DocumentId,
                    DocumentNumber = r.DocumentNumber,
                    Revision = r.Revision,
                    Action = r.Action,
                    Changes = r.Changes,
                    Snapshot = r.Snapshot,
                    UserName = r.User == null
                        ? null
                        : (r.User.FirstName + " " + r.User.LastName),
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();

            return ServiceResult<List<DocumentRevisionDto>>.SuccessResult(revisions);
        }

        private Guid GetTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }
    }
}

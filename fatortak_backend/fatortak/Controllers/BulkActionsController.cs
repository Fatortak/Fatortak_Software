using fatortak.Context;
using fatortak.Dtos.Bulk;
using fatortak.Dtos.Shared;
using fatortak.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace fatortak.Controllers
{
    [Route("api/bulk")]
    [ApiController]
    [Authorize]
    public class BulkActionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public BulkActionsController(
            ApplicationDbContext context,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        [HttpPost("customers/delete")]
        public async Task<ActionResult<ServiceResult<BulkActionResultDto>>> DeleteCustomers(
            [FromBody] BulkActionDto dto) =>
            await ApplyCustomers(dto, delete: true);

        [HttpPost("customers/activate")]
        public async Task<ActionResult<ServiceResult<BulkActionResultDto>>> ActivateCustomers(
            [FromBody] BulkActionDto dto) =>
            await ApplyCustomers(dto, delete: false);

        [HttpPost("items/delete")]
        public async Task<ActionResult<ServiceResult<BulkActionResultDto>>> DeleteItems(
            [FromBody] BulkActionDto dto) =>
            await ApplyItems(dto, delete: true);

        [HttpPost("items/activate")]
        public async Task<ActionResult<ServiceResult<BulkActionResultDto>>> ActivateItems(
            [FromBody] BulkActionDto dto) =>
            await ApplyItems(dto, delete: false);

        private async Task<ActionResult<ServiceResult<BulkActionResultDto>>> ApplyCustomers(
            BulkActionDto dto, bool delete)
        {
            if (dto.Ids.Count == 0)
                return BadRequest(ServiceResult<BulkActionResultDto>.Failure("Select at least one record."));

            var entities = await _context.Customers
                .Where(c => c.TenantId == TenantId && !c.IsDeleted && dto.Ids.Contains(c.Id))
                .ToListAsync();
            foreach (var entity in entities)
            {
                if (delete) entity.IsDeleted = true;
                else entity.IsActive = dto.IsActive;
                entity.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            return Ok(ServiceResult<BulkActionResultDto>.SuccessResult(new BulkActionResultDto
            {
                Affected = entities.Count,
                Missing = dto.Ids.Distinct().Count() - entities.Count
            }));
        }

        private async Task<ActionResult<ServiceResult<BulkActionResultDto>>> ApplyItems(
            BulkActionDto dto, bool delete)
        {
            if (dto.Ids.Count == 0)
                return BadRequest(ServiceResult<BulkActionResultDto>.Failure("Select at least one record."));

            var entities = await _context.Items
                .Where(i => i.TenantId == TenantId && !i.IsDeleted && dto.Ids.Contains(i.Id))
                .ToListAsync();
            foreach (var entity in entities)
            {
                if (delete) entity.IsDeleted = true;
                else entity.IsActive = dto.IsActive;
                entity.UpdatedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();

            return Ok(ServiceResult<BulkActionResultDto>.SuccessResult(new BulkActionResultDto
            {
                Affected = entities.Count,
                Missing = dto.Ids.Distinct().Count() - entities.Count
            }));
        }

        private Guid TenantId =>
            (_httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant)?.Id ?? Guid.Empty;
    }
}

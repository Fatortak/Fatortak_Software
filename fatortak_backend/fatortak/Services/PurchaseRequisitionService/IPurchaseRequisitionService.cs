using fatortak.Dtos.PurchaseRequisition;
using fatortak.Dtos.Shared;

namespace fatortak.Services.PurchaseRequisitionService
{
    public interface IPurchaseRequisitionService
    {
        Task<ServiceResult<PagedResponseDto<PurchaseRequisitionDto>>> GetAsync(
            PurchaseRequisitionFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<PurchaseRequisitionDto>> GetAsync(Guid id);
        Task<ServiceResult<PurchaseRequisitionDto>> CreateAsync(PurchaseRequisitionCreateDto dto);
        Task<ServiceResult<PurchaseRequisitionDto>> UpdateAsync(Guid id, PurchaseRequisitionUpdateDto dto);
        Task<ServiceResult<bool>> DeleteAsync(Guid id);
        Task<ServiceResult<PurchaseRequisitionDto>> UpdateStatusAsync(Guid id, string status);
    }
}

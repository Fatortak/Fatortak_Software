using fatortak.Dtos.Quotation;
using fatortak.Dtos.Shared;

namespace fatortak.Services.QuotationService
{
    public interface IQuotationService
    {
        Task<ServiceResult<PagedResponseDto<QuotationDto>>> GetQuotationsAsync(
            QuotationFilterDto filter, PaginationDto pagination);
        Task<ServiceResult<QuotationDto>> GetQuotationAsync(Guid quotationId);
        Task<ServiceResult<QuotationDto>> CreateQuotationAsync(QuotationCreateDto dto);
        Task<ServiceResult<QuotationDto>> UpdateQuotationAsync(Guid quotationId, QuotationUpdateDto dto);
        Task<ServiceResult<bool>> DeleteQuotationAsync(Guid quotationId);
        Task<ServiceResult<QuotationDto>> UpdateStatusAsync(Guid quotationId, string status);
        Task<ServiceResult<bool>> SendQuotationAsync(Guid quotationId);
        Task<ServiceResult<QuotationDto>> DuplicateQuotationAsync(Guid quotationId);
        Task<ServiceResult<QuotationDto>> ConvertToSalesOrderAsync(Guid quotationId);
        Task<ServiceResult<ConvertQuotationResultDto>> ConvertToInvoiceAsync(
            Guid quotationId, ConvertQuotationDto dto);
    }
}

namespace fatortak.Dtos.PurchaseRequisition
{
    public class PurchaseRequisitionItemCreateDto
    {
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal EstimatedUnitPrice { get; set; }
    }

    public class PurchaseRequisitionCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public DateTime NeededBy { get; set; } = DateTime.UtcNow.AddDays(14);
        public string? Notes { get; set; }
        public List<PurchaseRequisitionItemCreateDto> Items { get; set; } = new();
    }

    public class PurchaseRequisitionUpdateDto : PurchaseRequisitionCreateDto
    {
    }

    public class PurchaseRequisitionItemDto
    {
        public Guid Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal EstimatedUnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class PurchaseRequisitionDto
    {
        public Guid Id { get; set; }
        public string RequestNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? RequesterName { get; set; }
        public string? ApprovedByName { get; set; }
        public DateTime NeededBy { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? RejectedAt { get; set; }
        public List<PurchaseRequisitionItemDto> Items { get; set; } = new();
    }

    public class PurchaseRequisitionFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}

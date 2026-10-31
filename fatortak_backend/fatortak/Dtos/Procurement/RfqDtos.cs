namespace fatortak.Dtos.Procurement
{
    public class RfqItemCreateDto
    {
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal TargetUnitPrice { get; set; }
    }

    public class RfqCreateDto
    {
        public Guid? PurchaseRequisitionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(14);
        public string? Notes { get; set; }
        public string? Currency { get; set; }
        public List<RfqItemCreateDto> Items { get; set; } = new();
        public List<Guid> SupplierIds { get; set; } = new();
    }

    public class RfqUpdateDto : RfqCreateDto
    {
    }

    public class RfqSupplierQuoteItemDto
    {
        public Guid RfqItemId { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class RfqSupplierQuoteDto
    {
        public DateTime? ValidUntil { get; set; }
        public string? Notes { get; set; }
        public List<RfqSupplierQuoteItemDto> Items { get; set; } = new();
    }

    public class RfqItemDto
    {
        public Guid Id { get; set; }
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal TargetUnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class RfqSupplierItemDto
    {
        public Guid RfqItemId { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class RfqSupplierDto
    {
        public Guid Id { get; set; }
        public Guid SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? QuotedAt { get; set; }
        public DateTime? ValidUntil { get; set; }
        public decimal Total { get; set; }
        public string? Notes { get; set; }
        public List<RfqSupplierItemDto> Items { get; set; } = new();
    }

    public class RfqDto
    {
        public Guid Id { get; set; }
        public string RfqNumber { get; set; } = string.Empty;
        public Guid? PurchaseRequisitionId { get; set; }
        public string? PurchaseRequisitionNumber { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? Currency { get; set; }
        public Guid? AwardedSupplierId { get; set; }
        public string? AwardedSupplierName { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public string? PurchaseOrderNumber { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? AwardedAt { get; set; }
        public decimal TotalTargetValue { get; set; }
        public List<RfqItemDto> Items { get; set; } = new();
        public List<RfqSupplierDto> Suppliers { get; set; } = new();
    }

    public class RfqFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class AwardRfqDto
    {
        public DateTime? ExpectedDate { get; set; }
        public string? Terms { get; set; }
        public string? Notes { get; set; }
    }
}

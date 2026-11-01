namespace fatortak.Dtos.Procurement
{
    public class PurchaseOrderItemCreateDto
    {
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
    }

    public class PurchaseOrderCreateDto
    {
        public Guid SupplierId { get; set; }
        public Guid? PurchaseRequisitionId { get; set; }
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime ExpectedDate { get; set; } = DateTime.UtcNow.AddDays(14);
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public List<PurchaseOrderItemCreateDto> Items { get; set; } = new();
    }

    public class PurchaseOrderUpdateDto : PurchaseOrderCreateDto
    {
    }

    public class PurchaseOrderItemDto
    {
        public Guid Id { get; set; }
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }
        public int ReceivedQuantity { get; set; }
        public int RejectedQuantity { get; set; }
        public int BilledQuantity { get; set; }
        public int RemainingQuantity => Math.Max(0, Quantity - ReceivedQuantity - RejectedQuantity);
        public int RemainingToBill => Math.Max(0, ReceivedQuantity - BilledQuantity);
    }

    public class PurchaseOrderDto
    {
        public Guid Id { get; set; }
        public string PoNumber { get; set; } = string.Empty;
        public Guid SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public Guid? PurchaseRequisitionId { get; set; }
        public Guid? RequestForQuotationId { get; set; }
        public string? RfqNumber { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime ExpectedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public decimal Subtotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? OrderedAt { get; set; }
        public DateTime? ClosedAt { get; set; }
        public int GoodsReceiptCount { get; set; }
        public decimal ReceivedValue { get; set; }
        public List<PurchaseOrderItemDto> Items { get; set; } = new();
    }

    public class PurchaseOrderFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public Guid? SupplierId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class SupplierBillItemCreateDto
    {
        public Guid PurchaseOrderItemId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
    }

    public class SupplierBillCreateDto
    {
        public string SupplierInvoiceNumber { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime DueDate { get; set; } = DateTime.UtcNow.AddDays(30);
        public string? Notes { get; set; }
        public Guid? GoodsReceiptNoteId { get; set; }
        public List<SupplierBillItemCreateDto> Items { get; set; } = new();
    }

    public class SupplierBillLineDto
    {
        public Guid PurchaseOrderItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal PurchaseOrderUnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal LineTotal { get; set; }
        public decimal PriceVariance => UnitPrice - PurchaseOrderUnitPrice;
        public decimal AmountVariance => (UnitPrice - PurchaseOrderUnitPrice) * Quantity;
    }

    public class SupplierBillDto
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string? SupplierInvoiceNumber { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal Subtotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal Total { get; set; }
        public Guid? GoodsReceiptNoteId { get; set; }
        public bool HasVariance { get; set; }
        public List<SupplierBillLineDto> Lines { get; set; } = new();
    }

    public class SupplierBillMatchingDto
    {
        public Guid PurchaseOrderId { get; set; }
        public string PoNumber { get; set; } = string.Empty;
        public decimal ReceivedValue { get; set; }
        public decimal BilledValue { get; set; }
        public bool HasVariance { get; set; }
        public List<SupplierBillDto> Bills { get; set; } = new();
    }
}

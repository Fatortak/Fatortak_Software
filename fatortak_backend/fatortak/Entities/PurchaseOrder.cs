namespace fatortak.Entities
{
    public class PurchaseOrder : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string PoNumber { get; set; } = string.Empty;
        public Guid SupplierId { get; set; }
        public Guid? PurchaseRequisitionId { get; set; }
        public Guid? RequestForQuotationId { get; set; }
        public Guid? RfqSupplierId { get; set; }
        public Guid? UserId { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime ExpectedDate { get; set; }
        public string Status { get; set; } = "Draft";
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public decimal Subtotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? OrderedAt { get; set; }
        public DateTime? ClosedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Customer Supplier { get; set; } = null!;
        public PurchaseRequisition? PurchaseRequisition { get; set; }
        public RequestForQuotation? RequestForQuotation { get; set; }
        public RfqSupplier? RfqSupplier { get; set; }
        public ApplicationUser? User { get; set; }
        public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
        public ICollection<GoodsReceiptNote> GoodsReceipts { get; set; } = new List<GoodsReceiptNote>();
    }

    public class PurchaseOrderItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid PurchaseOrderId { get; set; }
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }
        public int ReceivedQuantity { get; set; }
        public int RejectedQuantity { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public PurchaseOrder PurchaseOrder { get; set; } = null!;
        public Item? Item { get; set; }
        public ICollection<GoodsReceiptItem> GoodsReceiptItems { get; set; } = new List<GoodsReceiptItem>();
    }
}

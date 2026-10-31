namespace fatortak.Entities
{
    public class GoodsReceiptNote : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string GrnNumber { get; set; } = string.Empty;
        public Guid PurchaseOrderId { get; set; }
        public Guid SupplierId { get; set; }
        public Guid? ReceivedByUserId { get; set; }
        public DateTime ReceivedDate { get; set; }
        public string Status { get; set; } = "Draft";
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? PostedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public PurchaseOrder PurchaseOrder { get; set; } = null!;
        public Customer Supplier { get; set; } = null!;
        public ApplicationUser? ReceivedByUser { get; set; }
        public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
    }

    public class GoodsReceiptItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid GoodsReceiptNoteId { get; set; }
        public Guid PurchaseOrderItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int OrderedQuantity { get; set; }
        public int ReceivedQuantity { get; set; }
        public int RejectedQuantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public GoodsReceiptNote GoodsReceiptNote { get; set; } = null!;
        public PurchaseOrderItem PurchaseOrderItem { get; set; } = null!;
    }
}

namespace fatortak.Dtos.Procurement
{
    public class GoodsReceiptItemCreateDto
    {
        public Guid PurchaseOrderItemId { get; set; }
        public int ReceivedQuantity { get; set; }
        public int RejectedQuantity { get; set; }
    }

    public class GoodsReceiptCreateDto
    {
        public Guid PurchaseOrderId { get; set; }
        public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;
        public string? Notes { get; set; }
        public List<GoodsReceiptItemCreateDto> Items { get; set; } = new();
    }

    public class GoodsReceiptUpdateDto : GoodsReceiptCreateDto
    {
    }

    public class GoodsReceiptItemDto
    {
        public Guid Id { get; set; }
        public Guid PurchaseOrderItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int OrderedQuantity { get; set; }
        public int ReceivedQuantity { get; set; }
        public int RejectedQuantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class GoodsReceiptDto
    {
        public Guid Id { get; set; }
        public string GrnNumber { get; set; } = string.Empty;
        public Guid PurchaseOrderId { get; set; }
        public string PoNumber { get; set; } = string.Empty;
        public Guid SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public DateTime ReceivedDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? ReceivedByName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PostedAt { get; set; }
        public decimal ReceivedValue { get; set; }
        public List<GoodsReceiptItemDto> Items { get; set; } = new();
    }

    public class GoodsReceiptFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public Guid? PurchaseOrderId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}

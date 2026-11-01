namespace fatortak.Dtos.Inventory
{
    public class StockAdjustmentCreateDto
    {
        public Guid ItemId { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow.Date;
        public int QuantityChange { get; set; }
        public decimal? UnitCost { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class StockAdjustmentDto
    {
        public Guid Id { get; set; }
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public int QuantityChange { get; set; }
        public decimal? UnitCost { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class StockAdjustmentFilterDto
    {
        public string? Search { get; set; }
        public Guid? ItemId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class InventoryValuationDto
    {
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public string? Code { get; set; }
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal Value { get; set; }
        public bool LowStock { get; set; }
    }

    public class InventoryValuationSummaryDto
    {
        public int ItemCount { get; set; }
        public int TotalQuantity { get; set; }
        public decimal TotalValue { get; set; }
        public int LowStockCount { get; set; }
        public List<InventoryValuationDto> Items { get; set; } = new();
    }
}

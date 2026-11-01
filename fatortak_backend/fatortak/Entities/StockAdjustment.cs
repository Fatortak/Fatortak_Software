namespace fatortak.Entities
{
    public class StockAdjustment : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid ItemId { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow.Date;
        public int QuantityChange { get; set; }
        public decimal? UnitCost { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public Guid? UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;
        public Item Item { get; set; } = null!;
        public ApplicationUser? User { get; set; }
    }
}

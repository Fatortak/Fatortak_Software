namespace fatortak.Entities
{
    public class PriceList : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Currency { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public ICollection<PriceListItem> Items { get; set; } = new List<PriceListItem>();
        public ICollection<CustomerPriceList> Customers { get; set; } = new List<CustomerPriceList>();
    }

    public class PriceListItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid PriceListId { get; set; }
        public Guid ItemId { get; set; }
        public decimal UnitPrice { get; set; }
        public int MinQuantity { get; set; } = 1;
        public int? MaxQuantity { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public PriceList PriceList { get; set; } = null!;
        public Item Item { get; set; } = null!;
    }

    public class CustomerPriceList : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid PriceListId { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;
        public Customer Customer { get; set; } = null!;
        public PriceList PriceList { get; set; } = null!;
    }
}

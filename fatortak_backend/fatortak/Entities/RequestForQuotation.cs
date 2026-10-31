namespace fatortak.Entities
{
    public class RequestForQuotation : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string RfqNumber { get; set; } = string.Empty;
        public Guid? PurchaseRequisitionId { get; set; }
        public Guid? UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }
        public string Status { get; set; } = "Draft";
        public string? Notes { get; set; }
        public string? Currency { get; set; }
        public Guid? AwardedSupplierId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? AwardedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public PurchaseRequisition? PurchaseRequisition { get; set; }
        public ApplicationUser? User { get; set; }
        public Customer? AwardedSupplier { get; set; }
        public ICollection<RfqItem> Items { get; set; } = new List<RfqItem>();
        public ICollection<RfqSupplier> Suppliers { get; set; } = new List<RfqSupplier>();
    }

    public class RfqItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid RequestForQuotationId { get; set; }
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal TargetUnitPrice { get; set; }
        public decimal LineTotal { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public RequestForQuotation RequestForQuotation { get; set; } = null!;
        public Item? Item { get; set; }
        public ICollection<RfqSupplierItem> Quotes { get; set; } = new List<RfqSupplierItem>();
    }

    public class RfqSupplier : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid RequestForQuotationId { get; set; }
        public Guid SupplierId { get; set; }
        public string Status { get; set; } = "Invited";
        public DateTime? QuotedAt { get; set; }
        public DateTime? ValidUntil { get; set; }
        public decimal Total { get; set; }
        public string? Notes { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public RequestForQuotation RequestForQuotation { get; set; } = null!;
        public Customer Supplier { get; set; } = null!;
        public ICollection<RfqSupplierItem> Items { get; set; } = new List<RfqSupplierItem>();
    }

    public class RfqSupplierItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid RfqSupplierId { get; set; }
        public Guid RfqItemId { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public RfqSupplier RfqSupplier { get; set; } = null!;
        public RfqItem RfqItem { get; set; } = null!;
    }
}

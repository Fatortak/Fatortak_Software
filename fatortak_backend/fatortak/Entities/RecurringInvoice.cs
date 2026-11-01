namespace fatortak.Entities
{
    public class RecurringInvoice : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string RecurringNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
        public Guid? UserId { get; set; }
        public string InvoiceType { get; set; } = "Sell";
        public string Frequency { get; set; } = "Monthly";
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime NextRunDate { get; set; }
        public int DueDays { get; set; } = 30;
        public bool AutoSend { get; set; }
        public string Status { get; set; } = "Active";
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public DateTime? LastRunAt { get; set; }
        public int RunCount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Customer Customer { get; set; } = null!;
        public Branch? Branch { get; set; }
        public Project? Project { get; set; }
        public ApplicationUser? User { get; set; }
        public ICollection<RecurringInvoiceItem> Items { get; set; } = new List<RecurringInvoiceItem>();
    }

    public class RecurringInvoiceItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid RecurringInvoiceId { get; set; }
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public RecurringInvoice RecurringInvoice { get; set; } = null!;
        public Item? Item { get; set; }
    }
}

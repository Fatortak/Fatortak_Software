namespace fatortak.Entities
{
    public class Quotation : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid? BranchId { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;
        public string DocumentType { get; set; } = "Quotation";
        public Guid? SourceQuotationId { get; set; }
        public Guid CustomerId { get; set; }
        public Guid? UserId { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime ValidUntil { get; set; }
        public string Status { get; set; } = "Draft";
        public decimal Subtotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal Total { get; set; }
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public string? AttachmentUrl { get; set; }
        public Guid? ProjectId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? ConvertedAt { get; set; }
        public Guid? ConvertedInvoiceId { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Customer Customer { get; set; } = null!;
        public ApplicationUser? User { get; set; }
        public Branch? Branch { get; set; }
        public Project? Project { get; set; }
        public ICollection<QuotationItem> Items { get; set; } = new List<QuotationItem>();
    }

    public class QuotationItem : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid QuotationId { get; set; }
        public Guid? ItemId { get; set; }
        public string? Description { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Quotation Quotation { get; set; } = null!;
        public Item? Item { get; set; }
    }
}

namespace fatortak.Entities
{
    public class ApprovalRequest : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Pending";
        public Guid? RequestedByUserId { get; set; }
        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
        public Guid? DecidedByUserId { get; set; }
        public DateTime? DecidedAt { get; set; }
        public string? DecisionNotes { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public ApplicationUser? RequestedByUser { get; set; }
        public ApplicationUser? DecidedByUser { get; set; }
    }

    public class ApprovalPolicy : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public decimal ThresholdAmount { get; set; }
        public bool IsEnabled { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
    }
}

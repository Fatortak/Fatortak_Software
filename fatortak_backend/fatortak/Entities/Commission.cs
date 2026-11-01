namespace fatortak.Entities
{
    public class CommissionRule : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public decimal Rate { get; set; }
        public string Basis { get; set; } = "Collected";
        public bool IsActive { get; set; } = true;
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow.Date;
        public DateTime? EffectiveTo { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public ApplicationUser? User { get; set; }
    }

    public class SalesCommission : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid InvoiceId { get; set; }
        public Guid RuleId { get; set; }
        public Guid? UserId { get; set; }
        public decimal BasisAmount { get; set; }
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending";
        public string Basis { get; set; } = "Collected";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ApprovedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public Guid? JournalEntryId { get; set; }
        public string? Notes { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Invoice Invoice { get; set; } = null!;
        public CommissionRule Rule { get; set; } = null!;
        public ApplicationUser? User { get; set; }
    }
}

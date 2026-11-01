namespace fatortak.Entities
{
    public class BankStatement : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid AccountId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal ClosingBalance { get; set; }
        public string Status { get; set; } = "Open";
        public DateTime ImportedAt { get; set; } = DateTime.UtcNow;
        public Guid? ImportedByUserId { get; set; }
        public string? Notes { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public Account Account { get; set; } = null!;
        public ApplicationUser? ImportedByUser { get; set; }
        public ICollection<BankStatementLine> Lines { get; set; } = new List<BankStatementLine>();
    }

    public class BankStatementLine : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid BankStatementId { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public string Status { get; set; } = "Unmatched";
        public Guid? MatchedTransactionId { get; set; }
        public DateTime? MatchedAt { get; set; }
        public string? Notes { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public BankStatement BankStatement { get; set; } = null!;
        public Transaction? MatchedTransaction { get; set; }
    }
}

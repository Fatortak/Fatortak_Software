namespace fatortak.Dtos.Commission
{
    public class CommissionRuleCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public decimal Rate { get; set; }
        public string Basis { get; set; } = "Collected";
        public bool IsActive { get; set; } = true;
        public DateTime EffectiveFrom { get; set; } = DateTime.UtcNow.Date;
        public DateTime? EffectiveTo { get; set; }
    }

    public class CommissionRuleUpdateDto : CommissionRuleCreateDto
    {
    }

    public class CommissionRuleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public decimal Rate { get; set; }
        public string Basis { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
    }

    public class GenerateCommissionDto
    {
        public Guid InvoiceId { get; set; }
        public Guid? RuleId { get; set; }
        public string? Notes { get; set; }
    }

    public class SalesCommissionDto
    {
        public Guid Id { get; set; }
        public Guid InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string? CustomerName { get; set; }
        public Guid RuleId { get; set; }
        public string RuleName { get; set; } = string.Empty;
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public decimal BasisAmount { get; set; }
        public decimal Rate { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Basis { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Notes { get; set; }
    }

    public class CommissionFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public Guid? UserId { get; set; }
    }
}

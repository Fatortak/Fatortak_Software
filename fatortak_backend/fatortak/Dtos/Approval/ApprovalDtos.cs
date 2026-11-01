namespace fatortak.Dtos.Approval
{
    public class ApprovalRequestCreateDto
    {
        public string DocumentType { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }

    public class ApprovalDecisionDto
    {
        public string? Notes { get; set; }
    }

    public class ApprovalRequestDto
    {
        public Guid Id { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? RequestedByName { get; set; }
        public DateTime RequestedAt { get; set; }
        public string? DecidedByName { get; set; }
        public DateTime? DecidedAt { get; set; }
        public string? DecisionNotes { get; set; }
    }

    public class ApprovalRequestFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? DocumentType { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class ApprovalCandidateDto
    {
        public string DocumentType { get; set; } = string.Empty;
        public string DocumentId { get; set; } = string.Empty;
        public string DocumentNumber { get; set; } = string.Empty;
        public string? PartyName { get; set; }
        public decimal Amount { get; set; }
        public DateTime Date { get; set; }
    }

    public class ApprovalPolicyDto
    {
        public string DocumentType { get; set; } = string.Empty;
        public decimal ThresholdAmount { get; set; }
        public bool IsEnabled { get; set; }
    }

    public class ApprovalPolicyUpdateDto
    {
        public string DocumentType { get; set; } = string.Empty;
        public decimal ThresholdAmount { get; set; }
        public bool IsEnabled { get; set; } = true;
    }
}

namespace fatortak.Dtos.BankReconciliation
{
    public class BankStatementLineCreateDto
    {
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
    }

    public class BankStatementImportDto
    {
        public Guid AccountId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal ClosingBalance { get; set; }
        public string? Notes { get; set; }
        public string? Csv { get; set; }
        public List<BankStatementLineCreateDto> Lines { get; set; } = new();
    }

    public class BankStatementLineDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? Reference { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid? MatchedTransactionId { get; set; }
        public DateTime? MatchedAt { get; set; }
        public string? Notes { get; set; }
    }

    public class BankStatementDto
    {
        public Guid Id { get; set; }
        public Guid AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? FileName { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal ClosingBalance { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime ImportedAt { get; set; }
        public string? ImportedByName { get; set; }
        public string? Notes { get; set; }
        public int LineCount { get; set; }
        public int MatchedCount { get; set; }
        public int UnmatchedCount { get; set; }
        public decimal TotalDebit { get; set; }
        public decimal TotalCredit { get; set; }
        public decimal StatementDifference { get; set; }
        public List<BankStatementLineDto> Lines { get; set; } = new();
    }

    public class BankStatementFilterDto
    {
        public string? Search { get; set; }
        public Guid? AccountId { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }

    public class MatchBankLineDto
    {
        public Guid TransactionId { get; set; }
    }

    public class BankTransactionCandidateDto
    {
        public Guid Id { get; set; }
        public DateTime Date { get; set; }
        public string? Description { get; set; }
        public decimal Amount { get; set; }
        public string Direction { get; set; } = string.Empty;
        public string? Type { get; set; }
    }
}

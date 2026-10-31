namespace fatortak.Dtos.Quotation
{
    public class QuotationItemCreateDto
    {
        public Guid? ItemId { get; set; }
        public string? Description { get; set; }
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; } = 0;
    }

    public class QuotationCreateDto
    {
        public Guid CustomerId { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? QuotationNumber { get; set; }
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public DateTime ValidUntil { get; set; } = DateTime.UtcNow.AddDays(30);
        public string? Status { get; set; } = "Draft";
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public string? AttachmentUrl { get; set; }
        public List<QuotationItemCreateDto> Items { get; set; } = new();
    }

    public class QuotationUpdateDto
    {
        public Guid CustomerId { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime ValidUntil { get; set; }
        public string? Status { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public string? AttachmentUrl { get; set; }
        public List<QuotationItemCreateDto> Items { get; set; } = new();
    }

    public class QuotationItemDto
    {
        public Guid Id { get; set; }
        public Guid? ItemId { get; set; }
        public string? ItemName { get; set; }
        public string? Description { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class QuotationDto
    {
        public Guid Id { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;
        public string DocumentType { get; set; } = "Quotation";
        public Guid? SourceQuotationId { get; set; }
        public Guid CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerPhoneNumber { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime ValidUntil { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal Total { get; set; }
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public string? AttachmentUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? SentAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? ConvertedAt { get; set; }
        public Guid? ConvertedInvoiceId { get; set; }
        public int DaysUntilExpiry { get; set; }
        public bool IsExpired { get; set; }
        public List<QuotationItemDto> Items { get; set; } = new();
    }

    public class QuotationFilterDto
    {
        public string? Search { get; set; }
        public string? DocumentType { get; set; }
        public Guid? CustomerId { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
    }

    public class ConvertQuotationDto
    {
        public DateTime? IssueDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Notes { get; set; }
    }

    public class ConvertQuotationResultDto
    {
        public Guid InvoiceId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }
}

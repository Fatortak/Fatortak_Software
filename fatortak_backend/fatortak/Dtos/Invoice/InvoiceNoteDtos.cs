namespace fatortak.Dtos.Invoice
{
    public class InvoiceNoteItemCreateDto
    {
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
    }

    public class InvoiceNoteCreateDto
    {
        public Guid OriginalInvoiceId { get; set; }
        public string NoteType { get; set; } = "Credit";
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public List<InvoiceNoteItemCreateDto> Items { get; set; } = new();
    }

    public class InvoiceNoteUpdateDto : InvoiceNoteCreateDto
    {
    }

    public class InvoiceNoteItemDto
    {
        public Guid Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class InvoiceNoteDto
    {
        public Guid Id { get; set; }
        public string NoteNumber { get; set; } = string.Empty;
        public string NoteType { get; set; } = string.Empty;
        public string InvoiceType { get; set; } = string.Empty;
        public Guid OriginalInvoiceId { get; set; }
        public string? OriginalInvoiceNumber { get; set; }
        public string? PartyName { get; set; }
        public DateTime IssueDate { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal Subtotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal Total { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PostedAt { get; set; }
        public List<InvoiceNoteItemDto> Items { get; set; } = new();
    }

    public class InvoiceNoteFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? NoteType { get; set; }
        public string? InvoiceType { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}

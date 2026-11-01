namespace fatortak.Dtos.RecurringInvoice
{
    public class RecurringInvoiceItemCreateDto
    {
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; } = 1;
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
    }

    public class RecurringInvoiceCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
        public string InvoiceType { get; set; } = "Sell";
        public string Frequency { get; set; } = "Monthly";
        public DateTime StartDate { get; set; } = DateTime.UtcNow.Date;
        public DateTime? EndDate { get; set; }
        public int DueDays { get; set; } = 30;
        public bool AutoSend { get; set; }
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public List<RecurringInvoiceItemCreateDto> Items { get; set; } = new();
    }

    public class RecurringInvoiceUpdateDto : RecurringInvoiceCreateDto
    {
    }

    public class RecurringInvoiceItemDto
    {
        public Guid Id { get; set; }
        public Guid? ItemId { get; set; }
        public string Description { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? VatRate { get; set; }
        public decimal Discount { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class RecurringInvoiceDto
    {
        public Guid Id { get; set; }
        public string RecurringNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public Guid CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public Guid? BranchId { get; set; }
        public Guid? ProjectId { get; set; }
        public string InvoiceType { get; set; } = string.Empty;
        public string Frequency { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime NextRunDate { get; set; }
        public int DueDays { get; set; }
        public bool AutoSend { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Currency { get; set; }
        public string? Notes { get; set; }
        public string? Terms { get; set; }
        public DateTime? LastRunAt { get; set; }
        public int RunCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public decimal Total { get; set; }
        public List<RecurringInvoiceItemDto> Items { get; set; } = new();
    }

    public class RecurringInvoiceFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? Frequency { get; set; }
        public Guid? CustomerId { get; set; }
    }
}

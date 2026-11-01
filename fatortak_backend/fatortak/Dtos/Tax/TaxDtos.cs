namespace fatortak.Dtos.Tax
{
    public class VatReturnLineDto
    {
        public DateTime Date { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public string Number { get; set; } = string.Empty;
        public string? PartyName { get; set; }
        public decimal TaxableAmount { get; set; }
        public decimal VatAmount { get; set; }
        public decimal Total { get; set; }
    }

    public class VatReturnDto
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public decimal SalesTaxable { get; set; }
        public decimal OutputVat { get; set; }
        public decimal PurchaseTaxable { get; set; }
        public decimal InputVat { get; set; }
        public decimal NetVat { get; set; }
        public List<VatReturnLineDto> Lines { get; set; } = new();
    }

    public class EInvoiceLineDto
    {
        public string Description { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal VatRate { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class EInvoiceDto
    {
        public Guid Id { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public string? CustomerName { get; set; }
        public string? CustomerTaxNumber { get; set; }
        public string? Currency { get; set; }
        public decimal Subtotal { get; set; }
        public decimal VatAmount { get; set; }
        public decimal Total { get; set; }
        public List<EInvoiceLineDto> Lines { get; set; } = new();
    }

    public class EInvoiceExportDto
    {
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public string Format { get; set; } = "generic-v1";
        public List<EInvoiceDto> Invoices { get; set; } = new();
    }
}

namespace fatortak.Dtos.Pricing
{
    public class PriceListItemCreateDto
    {
        public Guid ItemId { get; set; }
        public decimal UnitPrice { get; set; }
        public int MinQuantity { get; set; } = 1;
        public int? MaxQuantity { get; set; }
    }

    public class PriceListCreateDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Currency { get; set; }
        public DateTime ValidFrom { get; set; } = DateTime.UtcNow.Date;
        public DateTime? ValidTo { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsDefault { get; set; }
        public string? Notes { get; set; }
        public List<PriceListItemCreateDto> Items { get; set; } = new();
    }

    public class PriceListUpdateDto : PriceListCreateDto
    {
    }

    public class PriceListItemDto
    {
        public Guid Id { get; set; }
        public Guid ItemId { get; set; }
        public string ItemName { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int MinQuantity { get; set; }
        public int? MaxQuantity { get; set; }
    }

    public class PriceListDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Currency { get; set; }
        public DateTime ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public bool IsActive { get; set; }
        public bool IsDefault { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public int ItemCount { get; set; }
        public int CustomerCount { get; set; }
        public List<PriceListItemDto> Items { get; set; } = new();
        public List<Guid> CustomerIds { get; set; } = new();
        public List<string> CustomerNames { get; set; } = new();
    }

    public class PriceListFilterDto
    {
        public string? Search { get; set; }
        public bool? IsActive { get; set; }
    }

    public class AssignPriceListDto
    {
        public Guid CustomerId { get; set; }
    }

    public class ResolvePriceDto
    {
        public decimal UnitPrice { get; set; }
        public string? PriceListName { get; set; }
        public string Source { get; set; } = "Item";
    }
}

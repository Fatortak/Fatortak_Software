namespace fatortak.Dtos.SavedViews
{
    public class SavedViewCreateDto
    {
        public string PageKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string QueryJson { get; set; } = "{}";
        public bool IsShared { get; set; }
    }

    public class SavedViewUpdateDto
    {
        public string Name { get; set; } = string.Empty;
        public string QueryJson { get; set; } = "{}";
        public bool IsShared { get; set; }
    }

    public class SavedViewDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string PageKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string QueryJson { get; set; } = "{}";
        public bool IsShared { get; set; }
        public bool IsOwner { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

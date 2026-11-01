namespace fatortak.Entities
{
    public class SavedView : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid UserId { get; set; }
        public string PageKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string QueryJson { get; set; } = "{}";
        public bool IsShared { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public ApplicationUser User { get; set; } = null!;
    }
}

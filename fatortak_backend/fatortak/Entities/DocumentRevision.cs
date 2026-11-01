namespace fatortak.Entities
{
    public class DocumentRevision : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public string DocumentType { get; set; } = string.Empty;
        public Guid DocumentId { get; set; }
        public string DocumentNumber { get; set; } = string.Empty;
        public int Revision { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Changes { get; set; }
        public string? Snapshot { get; set; }
        public Guid? UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Tenant Tenant { get; set; } = null!;
        public ApplicationUser? User { get; set; }
    }
}

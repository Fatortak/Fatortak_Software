namespace fatortak.Entities
{
    public class UserSession : ITenantEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TenantId { get; set; }
        public Guid UserId { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(20);
        public DateTime? RevokedAt { get; set; }
        public Guid? RevokedByUserId { get; set; }

        public Tenant Tenant { get; set; } = null!;
        public ApplicationUser User { get; set; } = null!;
        public ApplicationUser? RevokedByUser { get; set; }
    }
}

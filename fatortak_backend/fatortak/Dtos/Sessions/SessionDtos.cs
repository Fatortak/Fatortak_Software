namespace fatortak.Dtos.Sessions
{
    public class UserSessionDto
    {
        public Guid Id { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string DeviceLabel { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime LastSeenAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public bool IsActive { get; set; }
        public bool IsCurrent { get; set; }
        public string? TenantName { get; set; }
    }
}

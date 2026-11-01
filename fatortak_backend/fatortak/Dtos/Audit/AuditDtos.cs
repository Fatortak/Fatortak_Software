namespace fatortak.Dtos.Audit
{
    public class AuditLogDto
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string? EntityLabel { get; set; }
        public string? Changes { get; set; }
        public string? UserName { get; set; }
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AuditLogFilterDto
    {
        public string? Search { get; set; }
        public string? EntityType { get; set; }
        public string? Action { get; set; }
        public Guid? UserId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}

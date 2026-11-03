namespace fatortak.Dtos.Platform
{
    public class PlatformOverviewDto
    {
        public int Tenants { get; set; }
        public int ActiveTenants { get; set; }
        public int SuspendedTenants { get; set; }
        public int Users { get; set; }
        public int ActiveUsers { get; set; }
        public int NewUsersLast30Days { get; set; }
        public int Invoices { get; set; }
        public int Customers { get; set; }
        public int Items { get; set; }
        public int ActiveSubscriptions { get; set; }
        public decimal TotalInvoiced { get; set; }
        public decimal TotalCollected { get; set; }
        public Dictionary<string, int> PlanBreakdown { get; set; } = new();
        public List<PlatformTenantDto> RecentTenants { get; set; } = new();
        public List<PlatformUserDto> RecentUsers { get; set; } = new();
        public List<PlatformActivityDto> RecentActivity { get; set; } = new();
    }

    public class PlatformTenantDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Subdomain { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UserCount { get; set; }
        public int InvoiceCount { get; set; }
        public int CustomerCount { get; set; }
        public int ItemCount { get; set; }
        public string? Plan { get; set; }
        public DateTime? SubscriptionEndsAt { get; set; }
        public DateTime? LastActivityAt { get; set; }
        public bool IsCurrent { get; set; }
    }

    public class PlatformUserDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public Guid? TenantId { get; set; }
        public string? TenantName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public bool IsOwner { get; set; }
        public bool IsCurrent { get; set; }
    }

    public class PlatformActivityDto
    {
        public Guid Id { get; set; }
        public string? TenantName { get; set; }
        public string? UserName { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string? EntityLabel { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PlatformTenantFilterDto
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
    }

    public class PlatformUserFilterDto
    {
        public string? Search { get; set; }
        public Guid? TenantId { get; set; }
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
    }

    public class PlatformStatusDto
    {
        public bool IsActive { get; set; }
    }

    public class PlatformRoleDto
    {
        public string Role { get; set; } = string.Empty;
    }

    public class RegistrationOptionsDto
    {
        public string Mode { get; set; } = string.Empty;
        public bool AllowRegistration { get; set; }
        public bool RequiresSubdomain { get; set; }
        public int TrialDays { get; set; } = 14;
    }

    public class SubdomainAvailabilityDto
    {
        public string Value { get; set; } = string.Empty;
        public bool Available { get; set; }
        public string? Reason { get; set; }
        public string? Suggestion { get; set; }
    }
}

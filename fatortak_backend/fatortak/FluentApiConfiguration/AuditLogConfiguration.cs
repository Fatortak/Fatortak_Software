using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
    {
        public void Configure(EntityTypeBuilder<AuditLog> builder)
        {
            builder.ToTable("AuditLogs");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Action).HasMaxLength(30).IsRequired();
            builder.Property(a => a.EntityType).HasMaxLength(100).IsRequired();
            builder.Property(a => a.EntityId).HasMaxLength(100).IsRequired();
            builder.Property(a => a.EntityLabel).HasMaxLength(300);
            builder.Property(a => a.IpAddress).HasMaxLength(64);
            builder.HasIndex(a => new { a.TenantId, a.CreatedAt });
            builder.HasIndex(a => new { a.TenantId, a.EntityType, a.EntityId });

            builder.HasOne(a => a.Tenant).WithMany().HasForeignKey(a => a.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

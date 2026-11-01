using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
    {
        public void Configure(EntityTypeBuilder<UserSession> builder)
        {
            builder.ToTable("UserSessions");
            builder.HasKey(s => s.Id);
            builder.Property(s => s.IpAddress).HasMaxLength(64);
            builder.Property(s => s.UserAgent).HasMaxLength(400);
            builder.HasIndex(s => new { s.TenantId, s.UserId, s.ExpiresAt });
            builder.HasIndex(s => new { s.UserId, s.RevokedAt });

            builder.HasOne(s => s.Tenant).WithMany().HasForeignKey(s => s.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(s => s.RevokedByUser).WithMany().HasForeignKey(s => s.RevokedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

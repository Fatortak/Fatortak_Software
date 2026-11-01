using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class ApprovalRequestConfiguration : IEntityTypeConfiguration<ApprovalRequest>
    {
        public void Configure(EntityTypeBuilder<ApprovalRequest> builder)
        {
            builder.ToTable("ApprovalRequests");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.DocumentType).HasMaxLength(50).IsRequired();
            builder.Property(a => a.DocumentId).HasMaxLength(100).IsRequired();
            builder.Property(a => a.DocumentNumber).HasMaxLength(100).IsRequired();
            builder.Property(a => a.Status).HasMaxLength(30).IsRequired();
            builder.Property(a => a.Amount).HasPrecision(18, 2);
            builder.HasIndex(a => new { a.TenantId, a.Status });
            builder.HasIndex(a => new { a.TenantId, a.DocumentType, a.DocumentId });

            builder.HasOne(a => a.Tenant).WithMany().HasForeignKey(a => a.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(a => a.RequestedByUser).WithMany().HasForeignKey(a => a.RequestedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(a => a.DecidedByUser).WithMany().HasForeignKey(a => a.DecidedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class ApprovalPolicyConfiguration : IEntityTypeConfiguration<ApprovalPolicy>
    {
        public void Configure(EntityTypeBuilder<ApprovalPolicy> builder)
        {
            builder.ToTable("ApprovalPolicies");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.DocumentType).HasMaxLength(50).IsRequired();
            builder.Property(a => a.ThresholdAmount).HasPrecision(18, 2);
            builder.HasIndex(a => new { a.TenantId, a.DocumentType }).IsUnique();

            builder.HasOne(a => a.Tenant).WithMany().HasForeignKey(a => a.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

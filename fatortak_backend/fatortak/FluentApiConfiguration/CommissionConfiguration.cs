using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class CommissionRuleConfiguration : IEntityTypeConfiguration<CommissionRule>
    {
        public void Configure(EntityTypeBuilder<CommissionRule> builder)
        {
            builder.ToTable("CommissionRules");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.Name).HasMaxLength(200).IsRequired();
            builder.Property(r => r.Basis).HasMaxLength(30).IsRequired();
            builder.Property(r => r.Rate).HasPrecision(9, 4);

            builder.HasOne(r => r.Tenant).WithMany().HasForeignKey(r => r.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class SalesCommissionConfiguration : IEntityTypeConfiguration<SalesCommission>
    {
        public void Configure(EntityTypeBuilder<SalesCommission> builder)
        {
            builder.ToTable("SalesCommissions");
            builder.HasKey(c => c.Id);
            builder.Property(c => c.Status).HasMaxLength(30).IsRequired();
            builder.Property(c => c.Basis).HasMaxLength(30).IsRequired();
            builder.Property(c => c.BasisAmount).HasPrecision(18, 2);
            builder.Property(c => c.Rate).HasPrecision(9, 4);
            builder.Property(c => c.Amount).HasPrecision(18, 2);
            builder.HasIndex(c => new { c.TenantId, c.InvoiceId, c.RuleId }).IsUnique();
            builder.HasIndex(c => new { c.TenantId, c.Status });

            builder.HasOne(c => c.Tenant).WithMany().HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(c => c.Invoice).WithMany().HasForeignKey(c => c.InvoiceId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(c => c.Rule).WithMany().HasForeignKey(c => c.RuleId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

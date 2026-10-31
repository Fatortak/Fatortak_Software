using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class PurchaseRequisitionConfiguration : IEntityTypeConfiguration<PurchaseRequisition>
    {
        public void Configure(EntityTypeBuilder<PurchaseRequisition> builder)
        {
            builder.ToTable("PurchaseRequisitions");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.RequestNumber).HasMaxLength(50).IsRequired();
            builder.Property(r => r.Title).HasMaxLength(200).IsRequired();
            builder.Property(r => r.Status).HasMaxLength(30).IsRequired();
            builder.Property(r => r.Total).HasPrecision(18, 2);
            builder.HasIndex(r => new { r.TenantId, r.RequestNumber }).IsUnique();

            builder.HasOne(r => r.Tenant).WithMany().HasForeignKey(r => r.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.ApprovedByUser).WithMany().HasForeignKey(r => r.ApprovedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class PurchaseRequisitionItemConfiguration : IEntityTypeConfiguration<PurchaseRequisitionItem>
    {
        public void Configure(EntityTypeBuilder<PurchaseRequisitionItem> builder)
        {
            builder.ToTable("PurchaseRequisitionItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Description).HasMaxLength(500).IsRequired();
            builder.Property(i => i.EstimatedUnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);

            builder.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(i => i.PurchaseRequisition)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.PurchaseRequisitionId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

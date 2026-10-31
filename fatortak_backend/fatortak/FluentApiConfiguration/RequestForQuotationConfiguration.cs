using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class RequestForQuotationConfiguration : IEntityTypeConfiguration<RequestForQuotation>
    {
        public void Configure(EntityTypeBuilder<RequestForQuotation> builder)
        {
            builder.ToTable("RequestForQuotations");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.RfqNumber).HasMaxLength(50).IsRequired();
            builder.Property(r => r.Title).HasMaxLength(200).IsRequired();
            builder.Property(r => r.Status).HasMaxLength(30).IsRequired();
            builder.Property(r => r.Currency).HasMaxLength(10);
            builder.HasIndex(r => new { r.TenantId, r.RfqNumber }).IsUnique();

            builder.HasOne(r => r.Tenant).WithMany().HasForeignKey(r => r.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.PurchaseRequisition).WithMany().HasForeignKey(r => r.PurchaseRequisitionId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.AwardedSupplier).WithMany().HasForeignKey(r => r.AwardedSupplierId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class RfqItemConfiguration : IEntityTypeConfiguration<RfqItem>
    {
        public void Configure(EntityTypeBuilder<RfqItem> builder)
        {
            builder.ToTable("RfqItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Description).HasMaxLength(500).IsRequired();
            builder.Property(i => i.TargetUnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);

            builder.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(i => i.RequestForQuotation)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.RequestForQuotationId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(i => i.Item).WithMany().HasForeignKey(i => i.ItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class RfqSupplierConfiguration : IEntityTypeConfiguration<RfqSupplier>
    {
        public void Configure(EntityTypeBuilder<RfqSupplier> builder)
        {
            builder.ToTable("RfqSuppliers");
            builder.HasKey(s => s.Id);
            builder.Property(s => s.Status).HasMaxLength(30).IsRequired();
            builder.Property(s => s.Total).HasPrecision(18, 2);
            builder.HasIndex(s => new { s.RequestForQuotationId, s.SupplierId }).IsUnique();

            builder.HasOne(s => s.Tenant).WithMany().HasForeignKey(s => s.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(s => s.RequestForQuotation)
                .WithMany(r => r.Suppliers)
                .HasForeignKey(s => s.RequestForQuotationId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(s => s.Supplier).WithMany().HasForeignKey(s => s.SupplierId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class RfqSupplierItemConfiguration : IEntityTypeConfiguration<RfqSupplierItem>
    {
        public void Configure(EntityTypeBuilder<RfqSupplierItem> builder)
        {
            builder.ToTable("RfqSupplierItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);
            builder.HasIndex(i => new { i.RfqSupplierId, i.RfqItemId }).IsUnique();

            builder.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(i => i.RfqSupplier)
                .WithMany(s => s.Items)
                .HasForeignKey(i => i.RfqSupplierId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(i => i.RfqItem).WithMany(i => i.Quotes).HasForeignKey(i => i.RfqItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

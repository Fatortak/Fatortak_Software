using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class PurchaseOrderConfiguration : IEntityTypeConfiguration<PurchaseOrder>
    {
        public void Configure(EntityTypeBuilder<PurchaseOrder> builder)
        {
            builder.ToTable("PurchaseOrders");
            builder.HasKey(o => o.Id);
            builder.Property(o => o.PoNumber).HasMaxLength(50).IsRequired();
            builder.Property(o => o.Status).HasMaxLength(30).IsRequired();
            builder.Property(o => o.Currency).HasMaxLength(10);
            builder.Property(o => o.Subtotal).HasPrecision(18, 2);
            builder.Property(o => o.VatAmount).HasPrecision(18, 2);
            builder.Property(o => o.TotalDiscount).HasPrecision(18, 2);
            builder.Property(o => o.Total).HasPrecision(18, 2);
            builder.HasIndex(o => new { o.TenantId, o.PoNumber }).IsUnique();
            builder.HasIndex(o => new { o.TenantId, o.Status });

            builder.HasOne(o => o.Tenant).WithMany().HasForeignKey(o => o.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(o => o.Supplier).WithMany().HasForeignKey(o => o.SupplierId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(o => o.PurchaseRequisition).WithMany().HasForeignKey(o => o.PurchaseRequisitionId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(o => o.RequestForQuotation).WithMany().HasForeignKey(o => o.RequestForQuotationId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(o => o.RfqSupplier).WithMany().HasForeignKey(o => o.RfqSupplierId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(o => o.User).WithMany().HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class PurchaseOrderItemConfiguration : IEntityTypeConfiguration<PurchaseOrderItem>
    {
        public void Configure(EntityTypeBuilder<PurchaseOrderItem> builder)
        {
            builder.ToTable("PurchaseOrderItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Description).HasMaxLength(500).IsRequired();
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.VatRate).HasPrecision(18, 4);
            builder.Property(i => i.Discount).HasPrecision(18, 4);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);

            builder.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(i => i.PurchaseOrder)
                .WithMany(o => o.Items)
                .HasForeignKey(i => i.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(i => i.Item).WithMany().HasForeignKey(i => i.ItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

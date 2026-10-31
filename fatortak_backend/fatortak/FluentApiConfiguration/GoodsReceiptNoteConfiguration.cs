using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class GoodsReceiptNoteConfiguration : IEntityTypeConfiguration<GoodsReceiptNote>
    {
        public void Configure(EntityTypeBuilder<GoodsReceiptNote> builder)
        {
            builder.ToTable("GoodsReceiptNotes");
            builder.HasKey(g => g.Id);
            builder.Property(g => g.GrnNumber).HasMaxLength(50).IsRequired();
            builder.Property(g => g.Status).HasMaxLength(30).IsRequired();
            builder.HasIndex(g => new { g.TenantId, g.GrnNumber }).IsUnique();
            builder.HasIndex(g => new { g.TenantId, g.PurchaseOrderId });

            builder.HasOne(g => g.Tenant).WithMany().HasForeignKey(g => g.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(g => g.PurchaseOrder).WithMany(o => o.GoodsReceipts)
                .HasForeignKey(g => g.PurchaseOrderId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(g => g.Supplier).WithMany().HasForeignKey(g => g.SupplierId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(g => g.ReceivedByUser).WithMany().HasForeignKey(g => g.ReceivedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class GoodsReceiptItemConfiguration : IEntityTypeConfiguration<GoodsReceiptItem>
    {
        public void Configure(EntityTypeBuilder<GoodsReceiptItem> builder)
        {
            builder.ToTable("GoodsReceiptItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Description).HasMaxLength(500).IsRequired();
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);

            builder.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(i => i.GoodsReceiptNote)
                .WithMany(g => g.Items)
                .HasForeignKey(i => i.GoodsReceiptNoteId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(i => i.PurchaseOrderItem)
                .WithMany(p => p.GoodsReceiptItems)
                .HasForeignKey(i => i.PurchaseOrderItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

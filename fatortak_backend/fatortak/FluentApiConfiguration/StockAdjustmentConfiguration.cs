using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class StockAdjustmentConfiguration : IEntityTypeConfiguration<StockAdjustment>
    {
        public void Configure(EntityTypeBuilder<StockAdjustment> builder)
        {
            builder.ToTable("StockAdjustments");
            builder.HasKey(a => a.Id);
            builder.Property(a => a.Reason).HasMaxLength(300).IsRequired();
            builder.Property(a => a.UnitCost).HasPrecision(18, 2);
            builder.HasIndex(a => new { a.TenantId, a.ItemId, a.Date });

            builder.HasOne(a => a.Tenant).WithMany().HasForeignKey(a => a.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(a => a.Item).WithMany().HasForeignKey(a => a.ItemId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

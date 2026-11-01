using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class PriceListConfiguration : IEntityTypeConfiguration<PriceList>
    {
        public void Configure(EntityTypeBuilder<PriceList> builder)
        {
            builder.ToTable("PriceLists");
            builder.HasKey(p => p.Id);
            builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
            builder.Property(p => p.Currency).HasMaxLength(10);
            builder.HasIndex(p => new { p.TenantId, p.Name });

            builder.HasOne(p => p.Tenant).WithMany().HasForeignKey(p => p.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class PriceListItemConfiguration : IEntityTypeConfiguration<PriceListItem>
    {
        public void Configure(EntityTypeBuilder<PriceListItem> builder)
        {
            builder.ToTable("PriceListItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);

            builder.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(i => i.PriceList)
                .WithMany(p => p.Items)
                .HasForeignKey(i => i.PriceListId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(i => i.Item).WithMany().HasForeignKey(i => i.ItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class CustomerPriceListConfiguration : IEntityTypeConfiguration<CustomerPriceList>
    {
        public void Configure(EntityTypeBuilder<CustomerPriceList> builder)
        {
            builder.ToTable("CustomerPriceLists");
            builder.HasKey(c => c.Id);
            builder.HasIndex(c => new { c.TenantId, c.CustomerId }).IsUnique();

            builder.HasOne(c => c.Tenant).WithMany().HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(c => c.Customer).WithMany().HasForeignKey(c => c.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(c => c.PriceList).WithMany(p => p.Customers)
                .HasForeignKey(c => c.PriceListId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

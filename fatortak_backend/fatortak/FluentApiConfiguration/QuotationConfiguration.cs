using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class QuotationConfiguration : IEntityTypeConfiguration<Quotation>
    {
        public void Configure(EntityTypeBuilder<Quotation> builder)
        {
            builder.ToTable("Quotations");
            builder.HasKey(q => q.Id);
            builder.Property(q => q.QuotationNumber).HasMaxLength(50).IsRequired();
            builder.Property(q => q.DocumentType).HasMaxLength(30).IsRequired();
            builder.Property(q => q.Status).HasMaxLength(30).IsRequired();
            builder.Property(q => q.Currency).HasMaxLength(10);
            builder.Property(q => q.Subtotal).HasPrecision(18, 2);
            builder.Property(q => q.VatAmount).HasPrecision(18, 2);
            builder.Property(q => q.TotalDiscount).HasPrecision(18, 2);
            builder.Property(q => q.Total).HasPrecision(18, 2);
            builder.HasIndex(q => new { q.TenantId, q.QuotationNumber }).IsUnique();
            builder.HasIndex(q => new { q.TenantId, q.DocumentType });

            builder.HasOne(q => q.Tenant)
                .WithMany()
                .HasForeignKey(q => q.TenantId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(q => q.Customer)
                .WithMany()
                .HasForeignKey(q => q.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(q => q.User)
                .WithMany()
                .HasForeignKey(q => q.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(q => q.Branch)
                .WithMany()
                .HasForeignKey(q => q.BranchId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(q => q.Project)
                .WithMany()
                .HasForeignKey(q => q.ProjectId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class QuotationItemConfiguration : IEntityTypeConfiguration<QuotationItem>
    {
        public void Configure(EntityTypeBuilder<QuotationItem> builder)
        {
            builder.ToTable("QuotationItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Description).HasMaxLength(500);
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.VatRate).HasPrecision(18, 4);
            builder.Property(i => i.Discount).HasPrecision(18, 4);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);

            builder.HasOne(i => i.Tenant)
                .WithMany()
                .HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.HasOne(i => i.Quotation)
                .WithMany(q => q.Items)
                .HasForeignKey(i => i.QuotationId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(i => i.Item)
                .WithMany()
                .HasForeignKey(i => i.ItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

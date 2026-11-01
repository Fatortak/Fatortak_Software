using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class RecurringInvoiceConfiguration : IEntityTypeConfiguration<RecurringInvoice>
    {
        public void Configure(EntityTypeBuilder<RecurringInvoice> builder)
        {
            builder.ToTable("RecurringInvoices");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.RecurringNumber).HasMaxLength(50).IsRequired();
            builder.Property(r => r.Name).HasMaxLength(200).IsRequired();
            builder.Property(r => r.Frequency).HasMaxLength(30).IsRequired();
            builder.Property(r => r.Status).HasMaxLength(30).IsRequired();
            builder.Property(r => r.Currency).HasMaxLength(10);
            builder.HasIndex(r => new { r.TenantId, r.RecurringNumber }).IsUnique();
            builder.HasIndex(r => new { r.TenantId, r.Status, r.NextRunDate });

            builder.HasOne(r => r.Tenant).WithMany().HasForeignKey(r => r.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.Customer).WithMany().HasForeignKey(r => r.CustomerId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.Branch).WithMany().HasForeignKey(r => r.BranchId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.Project).WithMany().HasForeignKey(r => r.ProjectId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class RecurringInvoiceItemConfiguration : IEntityTypeConfiguration<RecurringInvoiceItem>
    {
        public void Configure(EntityTypeBuilder<RecurringInvoiceItem> builder)
        {
            builder.ToTable("RecurringInvoiceItems");
            builder.HasKey(i => i.Id);
            builder.Property(i => i.Description).HasMaxLength(500).IsRequired();
            builder.Property(i => i.UnitPrice).HasPrecision(18, 2);
            builder.Property(i => i.VatRate).HasPrecision(18, 4);
            builder.Property(i => i.Discount).HasPrecision(18, 4);
            builder.Property(i => i.LineTotal).HasPrecision(18, 2);

            builder.HasOne(i => i.Tenant).WithMany().HasForeignKey(i => i.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(i => i.RecurringInvoice)
                .WithMany(r => r.Items)
                .HasForeignKey(i => i.RecurringInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(i => i.Item).WithMany().HasForeignKey(i => i.ItemId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

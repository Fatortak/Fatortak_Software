using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class SavedViewConfiguration : IEntityTypeConfiguration<SavedView>
    {
        public void Configure(EntityTypeBuilder<SavedView> builder)
        {
            builder.ToTable("SavedViews");
            builder.HasKey(v => v.Id);
            builder.Property(v => v.PageKey).HasMaxLength(80).IsRequired();
            builder.Property(v => v.Name).HasMaxLength(120).IsRequired();
            builder.Property(v => v.QueryJson).IsRequired();
            builder.HasIndex(v => new { v.TenantId, v.PageKey, v.UserId });

            builder.HasOne(v => v.Tenant).WithMany().HasForeignKey(v => v.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(v => v.User).WithMany().HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

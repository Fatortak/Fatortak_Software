using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class DocumentRevisionConfiguration : IEntityTypeConfiguration<DocumentRevision>
    {
        public void Configure(EntityTypeBuilder<DocumentRevision> builder)
        {
            builder.ToTable("DocumentRevisions");
            builder.HasKey(r => r.Id);
            builder.Property(r => r.DocumentType).HasMaxLength(50).IsRequired();
            builder.Property(r => r.DocumentNumber).HasMaxLength(100).IsRequired();
            builder.Property(r => r.Action).HasMaxLength(30).IsRequired();
            builder.HasIndex(r => new { r.TenantId, r.DocumentType, r.DocumentId, r.Revision }).IsUnique();

            builder.HasOne(r => r.Tenant).WithMany().HasForeignKey(r => r.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(r => r.User).WithMany().HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

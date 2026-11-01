using fatortak.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace fatortak.FluentApiConfiguration
{
    public class BankStatementConfiguration : IEntityTypeConfiguration<BankStatement>
    {
        public void Configure(EntityTypeBuilder<BankStatement> builder)
        {
            builder.ToTable("BankStatements");
            builder.HasKey(b => b.Id);
            builder.Property(b => b.Name).HasMaxLength(200).IsRequired();
            builder.Property(b => b.FileName).HasMaxLength(300);
            builder.Property(b => b.Status).HasMaxLength(30).IsRequired();
            builder.Property(b => b.OpeningBalance).HasPrecision(18, 2);
            builder.Property(b => b.ClosingBalance).HasPrecision(18, 2);
            builder.HasIndex(b => new { b.TenantId, b.AccountId, b.PeriodEnd });

            builder.HasOne(b => b.Tenant).WithMany().HasForeignKey(b => b.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(b => b.Account).WithMany().HasForeignKey(b => b.AccountId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(b => b.ImportedByUser).WithMany().HasForeignKey(b => b.ImportedByUserId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }

    public class BankStatementLineConfiguration : IEntityTypeConfiguration<BankStatementLine>
    {
        public void Configure(EntityTypeBuilder<BankStatementLine> builder)
        {
            builder.ToTable("BankStatementLines");
            builder.HasKey(l => l.Id);
            builder.Property(l => l.Description).HasMaxLength(500).IsRequired();
            builder.Property(l => l.Reference).HasMaxLength(200);
            builder.Property(l => l.Status).HasMaxLength(30).IsRequired();
            builder.Property(l => l.Debit).HasPrecision(18, 2);
            builder.Property(l => l.Credit).HasPrecision(18, 2);
            builder.HasIndex(l => new { l.TenantId, l.BankStatementId, l.Status });

            builder.HasOne(l => l.Tenant).WithMany().HasForeignKey(l => l.TenantId)
                .OnDelete(DeleteBehavior.NoAction);
            builder.HasOne(l => l.BankStatement)
                .WithMany(b => b.Lines)
                .HasForeignKey(l => l.BankStatementId)
                .OnDelete(DeleteBehavior.Cascade);
            builder.HasOne(l => l.MatchedTransaction)
                .WithMany()
                .HasForeignKey(l => l.MatchedTransactionId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

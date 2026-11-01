using fatortak.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace fatortak.Context
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            IHttpContextAccessor httpContextAccessor)
            : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        // Tenant management
        public DbSet<Tenant> Tenants { get; set; }

        // Tenant-specific
        public DbSet<Company> Companies { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Item> Items { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<QuotationItem> QuotationItems { get; set; }
        public DbSet<PurchaseRequisition> PurchaseRequisitions { get; set; }
        public DbSet<PurchaseRequisitionItem> PurchaseRequisitionItems { get; set; }
        public DbSet<RequestForQuotation> RequestForQuotations { get; set; }
        public DbSet<RfqItem> RfqItems { get; set; }
        public DbSet<RfqSupplier> RfqSuppliers { get; set; }
        public DbSet<RfqSupplierItem> RfqSupplierItems { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<GoodsReceiptNote> GoodsReceiptNotes { get; set; }
        public DbSet<GoodsReceiptItem> GoodsReceiptItems { get; set; }
        public DbSet<RecurringInvoice> RecurringInvoices { get; set; }
        public DbSet<RecurringInvoiceItem> RecurringInvoiceItems { get; set; }
        public DbSet<ApprovalRequest> ApprovalRequests { get; set; }
        public DbSet<ApprovalPolicy> ApprovalPolicies { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<BankStatement> BankStatements { get; set; }
        public DbSet<BankStatementLine> BankStatementLines { get; set; }
        public DbSet<PriceList> PriceLists { get; set; }
        public DbSet<PriceListItem> PriceListItems { get; set; }
        public DbSet<CustomerPriceList> CustomerPriceLists { get; set; }
        public DbSet<Expenses> Expenses { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<Installment> Installments { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<WorkSetting> WorkSettings { get; set; }
        public DbSet<GeneralVacation> GeneralVacations { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Payroll> Payrolls { get; set; }
        public DbSet<PayrollItem> PayrollItems { get; set; }
        public DbSet<Branch> Branches { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectLine> ProjectLines { get; set; }
        public DbSet<Cheque> Cheques { get; set; }
        public DbSet<Stakeholder> Stakeholders { get; set; }
        public DbSet<StakeholderTransaction> StakeholderTransactions { get; set; }

        // Accounting module
        public DbSet<Account> Accounts { get; set; }
        public DbSet<JournalEntry> JournalEntries { get; set; }
        public DbSet<JournalEntryLine> JournalEntryLines { get; set; }
        public DbSet<ExpenseCategory> ExpenseCategories { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.HasDefaultSchema("dbo");

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Customer)
                .WithMany(c => c.Invoices)
                .HasForeignKey(i => i.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasIndex(i => new { i.TenantId, i.InvoiceNumber })
                .IsUnique();

            modelBuilder.Entity<InvoiceItem>()
                .HasOne(ii => ii.Invoice)
                .WithMany(i => i.InvoiceItems)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cheque>()
                .HasOne(c => c.Invoice)
                .WithMany()
                .HasForeignKey(c => c.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cheque>()
                .HasOne(c => c.PaymentAccount)
                .WithMany()
                .HasForeignKey(c => c.PaymentAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Cheque>()
                .HasOne(c => c.Tenant)
                .WithMany()
                .HasForeignKey(c => c.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ApplicationUser>()
                .HasOne(u => u.Tenant)
                .WithMany(t => t.Users)
                .HasForeignKey(u => u.TenantId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Tenant)
                .WithMany()
                .HasForeignKey(n => n.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Employee>()
                .HasOne(n => n.Tenant)
                .WithMany()
                .HasForeignKey(n => n.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<Attendance>()
                .HasOne(n => n.Tenant)
                .WithMany()
                .HasForeignKey(n => n.TenantId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<ChatSession>()
                .HasOne(n => n.Tenant)
                .WithMany()
                .HasForeignKey(n => n.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatSession>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);


            modelBuilder.Entity<Payroll>()
                .HasOne(n => n.Tenant)
                .WithMany()
                .HasForeignKey(n => n.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Payroll>()
                .HasIndex(p => new { p.TenantId, p.Year, p.Month })
                .IsUnique();

            modelBuilder.Entity<PayrollItem>()
                .HasOne(n => n.Tenant)
                .WithMany()
                .HasForeignKey(n => n.TenantId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PayrollItem>()
                .HasOne(pi => pi.Payroll)
                .WithMany(p => p.PayrollItems)
                .HasForeignKey(pi => pi.PayrollId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectLine>()
                .HasOne(pl => pl.Project)
                .WithMany(p => p.ProjectLines)
                .HasForeignKey(pl => pl.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Stakeholder>()
                .HasOne(s => s.Account)
                .WithMany()
                .HasForeignKey(s => s.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<StakeholderTransaction>()
                .HasOne(t => t.Stakeholder)
                .WithMany(s => s.Transactions)
                .HasForeignKey(t => t.StakeholderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<StakeholderTransaction>()
                .HasOne(t => t.PaymentAccount)
                .WithMany()
                .HasForeignKey(t => t.PaymentAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<StakeholderTransaction>()
                .HasOne(t => t.JournalEntry)
                .WithMany()
                .HasForeignKey(t => t.JournalEntryId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }

        private Guid GetCurrentTenantId()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            return tenant?.Id ?? Guid.Empty;
        }

        public override int SaveChanges()
        {
            SetTenantIds();
            AddAuditLogs();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(
            CancellationToken cancellationToken = default)
        {
            SetTenantIds();
            AddAuditLogs();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private static readonly HashSet<Type> AuditedTypes = new()
        {
            typeof(Invoice), typeof(Quotation), typeof(PurchaseOrder), typeof(GoodsReceiptNote),
            typeof(PurchaseRequisition), typeof(RequestForQuotation), typeof(RecurringInvoice),
            typeof(ApprovalRequest), typeof(Customer), typeof(Item), typeof(Expenses),
            typeof(Transaction), typeof(JournalEntry), typeof(Payroll), typeof(Employee),
            typeof(Stakeholder), typeof(Account), typeof(Company)
        };

        private static readonly HashSet<string> SkippedProperties = new(StringComparer.OrdinalIgnoreCase)
        {
            "PasswordHash", "SecurityStamp", "ConcurrencyStamp", "TenantId",
            "CreatedAt", "UpdatedAt"
        };

        private void AddAuditLogs()
        {
            var http = _httpContextAccessor.HttpContext;
            Guid? userId = Guid.TryParse(http?.User?.FindFirst("UserId")?.Value, out var parsedUser)
                ? parsedUser
                : null;
            var ip = http?.Connection?.RemoteIpAddress?.ToString();

            var logs = new List<AuditLog>();
            foreach (var entry in ChangeTracker.Entries()
                .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
                .Where(e => AuditedTypes.Contains(e.Entity.GetType())))
            {
                var tenantId = (entry.Entity as ITenantEntity)?.TenantId ?? GetCurrentTenantId();
                if (tenantId == Guid.Empty) continue;

                var changes = BuildChangeSet(entry);
                if (entry.State == EntityState.Modified && string.IsNullOrEmpty(changes)) continue;

                var id = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())
                    ?.CurrentValue?.ToString() ?? string.Empty;

                logs.Add(new AuditLog
                {
                    TenantId = tenantId,
                    UserId = userId,
                    Action = entry.State.ToString(),
                    EntityType = entry.Entity.GetType().Name,
                    EntityId = id,
                    EntityLabel = BuildEntityLabel(entry.Entity),
                    Changes = changes,
                    IpAddress = ip
                });
            }

            if (logs.Count > 0)
                AuditLogs.AddRange(logs);
        }

        private static string? BuildChangeSet(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
        {
            var values = new Dictionary<string, object?>();
            foreach (var property in entry.Properties)
            {
                if (property.Metadata.IsPrimaryKey() ||
                    property.Metadata.IsForeignKey() && property.Metadata.Name.EndsWith("Id") && property.Metadata.Name == "TenantId" ||
                    SkippedProperties.Contains(property.Metadata.Name))
                    continue;

                var value = entry.State == EntityState.Deleted
                    ? property.OriginalValue
                    : property.CurrentValue;
                if (entry.State == EntityState.Modified && Equals(property.OriginalValue, value))
                    continue;

                if (value is null) continue;
                var type = value.GetType();
                if (!(type.IsPrimitive || type.IsEnum || value is string || value is Guid ||
                      value is DateTime || value is DateTimeOffset || value is decimal || value is DateOnly))
                    continue;

                values[property.Metadata.Name] = entry.State == EntityState.Modified
                    ? new { from = property.OriginalValue, to = value }
                    : value;
            }

            return values.Count == 0 ? null : JsonSerializer.Serialize(values);
        }

        private static string? BuildEntityLabel(object entity) => entity switch
        {
            Invoice invoice => invoice.InvoiceNumber,
            Quotation quotation => quotation.QuotationNumber,
            PurchaseOrder order => order.PoNumber,
            GoodsReceiptNote receipt => receipt.GrnNumber,
            PurchaseRequisition requisition => requisition.RequestNumber,
            RequestForQuotation rfq => rfq.RfqNumber,
            RecurringInvoice recurring => recurring.RecurringNumber,
            ApprovalRequest approval => approval.DocumentNumber,
            Customer customer => customer.Name,
            Item item => item.Name,
            Account account => $"{account.AccountCode} - {account.Name}",
            JournalEntry journal => journal.EntryNumber,
            Transaction transaction => transaction.Description,
            Expenses expense => expense.Notes ?? $"EXP-{expense.Id}",
            Payroll payroll => $"Payroll {payroll.Month}/{payroll.Year}",
            Employee employee => employee.FullName,
            Stakeholder stakeholder => stakeholder.Name,
            Company company => company.Name,
            _ => entity.GetType().Name
        };

        private void SetTenantIds()
        {
            var tenant = _httpContextAccessor.HttpContext?.Items["CurrentTenant"] as Tenant;
            if (tenant == null) return;

            foreach (var entry in ChangeTracker.Entries<ITenantEntity>()
                .Where(e => e.State == EntityState.Added))
            {
                entry.Entity.TenantId = tenant.Id;
            }
        }
    }
}

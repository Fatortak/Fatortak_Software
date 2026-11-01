using fatortak.Common.Enum;
using fatortak.Context;
using fatortak.Entities;
using fatortak.Services.Deployment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace fatortak.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/self-hosted")]
    public class SelfHostedController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IDeploymentMode _deployment;
        private readonly IConfiguration _configuration;

        public SelfHostedController(
            ApplicationDbContext context,
            IDeploymentMode deployment,
            IConfiguration configuration)
        {
            _context = context;
            _deployment = deployment;
            _configuration = configuration;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var isSysAdmin = string.Equals(role, RoleEnum.SysAdmin.ToString(), StringComparison.OrdinalIgnoreCase);
            var isAdmin = string.Equals(role, RoleEnum.Admin.ToString(), StringComparison.OrdinalIgnoreCase);

            if (!isSysAdmin && !isAdmin)
                return Forbid();

            var tenantId = (HttpContext.Items["CurrentTenant"] as Tenant)?.Id;
            var scoped = !isSysAdmin;
            if (scoped && tenantId == null)
                return Forbid();

            var onlineCutoff = DateTime.UtcNow.AddMinutes(-5);
            var monthAgo = DateTime.UtcNow.AddDays(-30);

            var usersQuery = _context.Users.AsQueryable();
            var companiesQuery = _context.Companies.AsQueryable();
            var customersQuery = _context.Customers.AsQueryable();
            var itemsQuery = _context.Items.AsQueryable();
            var invoicesQuery = _context.Invoices.AsQueryable();
            var expensesQuery = _context.Expenses.AsQueryable();
            var transactionsQuery = _context.Transactions.AsQueryable();
            var projectsQuery = _context.Projects.AsQueryable();
            var accountsQuery = _context.Accounts.AsQueryable();
            var journalQuery = _context.JournalEntries.AsQueryable();
            var employeesQuery = _context.Employees.AsQueryable();
            var chequesQuery = _context.Cheques.AsQueryable();
            var stakeholdersQuery = _context.Stakeholders.AsQueryable();
            var sessionsQuery = _context.UserSessions.AsQueryable();

            if (scoped)
            {
                usersQuery = usersQuery.Where(u => u.TenantId == tenantId);
                companiesQuery = companiesQuery.Where(x => x.TenantId == tenantId);
                customersQuery = customersQuery.Where(x => x.TenantId == tenantId);
                itemsQuery = itemsQuery.Where(x => x.TenantId == tenantId);
                invoicesQuery = invoicesQuery.Where(x => x.TenantId == tenantId);
                expensesQuery = expensesQuery.Where(x => x.TenantId == tenantId);
                transactionsQuery = transactionsQuery.Where(x => x.TenantId == tenantId);
                projectsQuery = projectsQuery.Where(x => x.TenantId == tenantId);
                accountsQuery = accountsQuery.Where(x => x.TenantId == tenantId);
                journalQuery = journalQuery.Where(x => x.TenantId == tenantId);
                employeesQuery = employeesQuery.Where(x => x.TenantId == tenantId);
                chequesQuery = chequesQuery.Where(x => x.TenantId == tenantId);
                stakeholdersQuery = stakeholdersQuery.Where(x => x.TenantId == tenantId);
                sessionsQuery = sessionsQuery.Where(s => s.TenantId == tenantId);
            }

            var stats = new
            {
                selfHosted = _deployment.IsSelfHosted,
                registrationEnabled = _deployment.AllowRegistration,
                generatedAt = DateTime.UtcNow,
                scope = scoped ? "tenant" : "installation",
                users = new
                {
                    total = await usersQuery.CountAsync(),
                    active = await usersQuery.CountAsync(u => u.IsActive),
                    online = await usersQuery.CountAsync(u =>
                        u.LastSeenAt != null && u.LastSeenAt >= onlineCutoff),
                    registeredLast30Days = await usersQuery.CountAsync(u => u.CreatedAt >= monthAgo)
                },
                sessions = new
                {
                    total = await sessionsQuery.CountAsync(),
                    active = await sessionsQuery.CountAsync(s =>
                        s.RevokedAt == null && s.ExpiresAt > DateTime.UtcNow),
                    recent = await sessionsQuery
                        .OrderByDescending(s => s.LastSeenAt)
                        .Take(10)
                        .Select(s => new
                        {
                            s.Id,
                            UserName = s.User.FirstName + " " + s.User.LastName,
                            s.IpAddress,
                            s.CreatedAt,
                            s.LastSeenAt,
                            s.ExpiresAt,
                            s.RevokedAt
                        })
                        .ToListAsync()
                },
                system = new
                {
                    version = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "unknown",
                    runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
                    environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                    databaseProvider = _context.Database.ProviderName,
                    latestMigration = (await _context.Database.GetAppliedMigrationsAsync()).LastOrDefault(),
                    backup = BuildBackupStatus()
                },
                data = new
                {
                    tenants = scoped ? 1 : await _context.Tenants.CountAsync(),
                    companies = await companiesQuery.CountAsync(),
                    customers = await customersQuery.CountAsync(),
                    items = await itemsQuery.CountAsync(),
                    invoices = await invoicesQuery.CountAsync(),
                    expenses = await expensesQuery.CountAsync(),
                    transactions = await transactionsQuery.CountAsync(),
                    projects = await projectsQuery.CountAsync(),
                    accounts = await accountsQuery.CountAsync(),
                    journalEntries = await journalQuery.CountAsync(),
                    employees = await employeesQuery.CountAsync(),
                    cheques = await chequesQuery.CountAsync(),
                    stakeholders = await stakeholdersQuery.CountAsync()
                },
                recentUsers = await usersQuery
                    .OrderByDescending(u => u.CreatedAt)
                    .Take(10)
                    .Select(u => new
                    {
                        u.Id,
                        FullName = u.FirstName + " " + u.LastName,
                        u.Email,
                        u.Role,
                        u.IsActive,
                        u.CreatedAt,
                        u.LastLoginAt,
                        u.LastSeenAt
                    })
                    .ToListAsync()
            };

            return Ok(stats);
        }

        [HttpGet("online")]
        public async Task<IActionResult> GetOnlineUsers()
        {
            var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var isSysAdmin = string.Equals(role, RoleEnum.SysAdmin.ToString(), StringComparison.OrdinalIgnoreCase);
            var isAdmin = string.Equals(role, RoleEnum.Admin.ToString(), StringComparison.OrdinalIgnoreCase);

            if (!isSysAdmin && !isAdmin)
                return Forbid();

            var tenantId = (HttpContext.Items["CurrentTenant"] as Tenant)?.Id;
            var scoped = !isSysAdmin;
            if (scoped && tenantId == null)
                return Forbid();

            var cutoff = DateTime.UtcNow.AddMinutes(-5);
            var usersQuery = _context.Users
                .Where(u => u.LastSeenAt != null && u.LastSeenAt >= cutoff);

            if (scoped)
                usersQuery = usersQuery.Where(u => u.TenantId == tenantId);

            var users = await usersQuery
                .OrderByDescending(u => u.LastSeenAt)
                .Select(u => new
                {
                    u.Id,
                    FullName = u.FirstName + " " + u.LastName,
                    u.Email,
                    u.Role,
                    u.LastSeenAt,
                    u.LastLoginAt
                })
                .ToListAsync();

            return Ok(new { count = users.Count, users });
        }

        private object BuildBackupStatus()
        {
            var directory = _configuration["SelfHosted:BackupDirectory"];
            if (string.IsNullOrWhiteSpace(directory))
                return new
                {
                    configured = false,
                    status = "NotConfigured",
                    directory = (string?)null,
                    lastBackupAt = (DateTime?)null,
                    fileName = (string?)null
                };

            if (!Directory.Exists(directory))
                return new
                {
                    configured = true,
                    status = "DirectoryNotFound",
                    directory,
                    lastBackupAt = (DateTime?)null,
                    fileName = (string?)null
                };

            var latest = new DirectoryInfo(directory)
                .EnumerateFiles("*.bak", SearchOption.TopDirectoryOnly)
                .OrderByDescending(f => f.LastWriteTimeUtc)
                .FirstOrDefault();

            if (latest == null)
                return new
                {
                    configured = true,
                    status = "NoBackup",
                    directory,
                    lastBackupAt = (DateTime?)null,
                    fileName = (string?)null
                };

            var age = DateTime.UtcNow - latest.LastWriteTimeUtc;
            return new
            {
                configured = true,
                status = age.TotalDays <= 7 ? "Healthy" : "Stale",
                directory,
                lastBackupAt = (DateTime?)latest.LastWriteTimeUtc,
                fileName = latest.Name,
                ageDays = Math.Round(age.TotalDays, 1)
            };
        }
    }
}

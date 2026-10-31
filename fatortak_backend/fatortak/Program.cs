
using fatortak.Context;
using fatortak.Entities;
using fatortak.Helpers;
using fatortak.Middlewares;
using fatortak.Seeding;
using fatortak.Services.AccountingPostingService;
using fatortak.Services.AccountingService;
using fatortak.Services.AuthService;
using fatortak.Services.BackfillService;
using fatortak.Services.BranchService;
using fatortak.Services.ChatService;
using fatortak.Services.CompanyService;
using fatortak.Services.ChequeService;
using fatortak.Services.CustodyService;
using fatortak.Services.CustomerService;
using fatortak.Services.DashboardService;
using fatortak.Services.Deployment;
using fatortak.Services.EmailService;
using fatortak.Services.ExpenseCategoryService;
using fatortak.Services.ExpenseService;
using fatortak.Services.FinancialReportService;
using fatortak.Services.GeminiService;
using fatortak.Services.HR;
using fatortak.Services.HR.AttendanceService;
using fatortak.Services.HR.DepartmentService;
using fatortak.Services.HR.EmployeeService;
using fatortak.Services.HR.WorkSettingService;
using fatortak.Services.InvoiceService;
using fatortak.Services.ItemService;
using fatortak.Services.NotificationService;
using fatortak.Services.ProjectService;
using fatortak.Services.QuotaService;
using fatortak.Services.QuotationService;
using fatortak.Services.PurchaseRequisitionService;
using fatortak.Services.ReminderService;
using fatortak.Services.StakeholderService;
using fatortak.Services.SubscriptionService;
using fatortak.Services.TenantService;
using fatortak.Services.TokenService;
using fatortak.Services.TransactionService;
using fatortak.Services.UserService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StudBook.Helpers;
using System.Text;
using System.Threading.RateLimiting;

namespace fatortak
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? new[]
                {
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://127.0.0.1:3000",
                    "http://127.0.0.1:5173",
                    "http://localhost:5002"
                };

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AppCors", policy =>
                {
                    policy
                        .WithOrigins(allowedOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                });
            });

            builder.Services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddPolicy("auth", context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 10,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0
                        }));
                options.AddPolicy("ai", context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        context.User.FindFirst("UserId")?.Value ??
                        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 20,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0
                        }));
                options.AddPolicy("public", context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = 60,
                            Window = TimeSpan.FromMinutes(1),
                            QueueLimit = 0
                        }));
            });

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
                });
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();




            #region Swagger Config
            builder.Services.AddSwaggerGen(options =>
            {
                options.CustomSchemaIds(type => type.FullName); // ? important line
                options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
                {
                    Title = "Fatortak API",
                    Version = "v1"
                });

                options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Description = "Enter JWT token like this: Bearer {your token}"
                });

                options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });
            #endregion

            builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Configure Data Protection to persist keys in a local directory
            // This ensures tokens (like password reset) remain valid even after application restarts
            var keysPath = Path.Combine(builder.Environment.ContentRootPath, "App_Data", "Keys");
            if (!Directory.Exists(keysPath)) Directory.CreateDirectory(keysPath);

            builder.Services.AddDataProtection()
                .PersistKeysToFileSystem(new DirectoryInfo(keysPath))
                .SetApplicationName("FatortakApp");

            #region Services registration
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<ICompanyService, CompanyService>();
            builder.Services.AddScoped<IUserProfileService, UserProfileService>();
            builder.Services.AddScoped<ICustomerService, CustomerService>();
            builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IQuotationService, QuotationService>();
builder.Services.AddScoped<IPurchaseRequisitionService, PurchaseRequisitionService>();
            builder.Services.AddSingleton<IPublicInvoiceTokenService, PublicInvoiceTokenService>();
            builder.Services.AddSingleton<IDeploymentMode, DeploymentMode>();
            builder.Services.AddScoped<IItemService, ItemService>();

            builder.Services.AddScoped<ITenantService, TenantService>();
            builder.Services.AddScoped<ITokenService, TokenService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IDashboardService, DashboardService>();
            builder.Services.AddScoped<IExpenseService, ExpenseService>();
            builder.Services.AddScoped<IQuotaService, QuotaService>();
            builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
            builder.Services.AddScoped<IEmployeeService, EmployeeService>();
            builder.Services.AddScoped<IDepartmentService, DepartmentService>();
            builder.Services.AddScoped<IAttendanceService, AttendanceService>();
            builder.Services.AddScoped<IWorkSettingService, WorkSettingService>();
            builder.Services.AddScoped<IChatService, ChatService>();
            builder.Services.AddScoped<IEmailService, EmailService>();
            builder.Services.AddHttpClient<GeminiService>();
            builder.Services.AddScoped<GeminiService>();
            builder.Services.AddScoped<INotificationService, NotificationService>();
            builder.Services.AddHostedService<ReminderGeneratorService>();
            builder.Services.AddHostedService<NotificationCleanupService>();
            builder.Services.AddScoped<ITransactionService, TransactionService>();
            builder.Services.AddScoped<IBackfillService, BackfillService>();

            builder.Services.AddScoped<IPayrollService, PayrollService>();
            builder.Services.AddScoped<IBranchService, BranchService>();
            builder.Services.AddScoped<IProjectService, ProjectService>();
            builder.Services.AddScoped<IProjectExportService, ProjectExportService>();
            builder.Services.AddScoped<IAccountingService, AccountingService>();
            builder.Services.AddScoped<IAccountingPostingService, AccountingPostingService>();
            builder.Services.AddScoped<ICustodyService, CustodyService>();
            builder.Services.AddScoped<IChequeService, ChequeService>();
            builder.Services.AddScoped<IStakeholderService, StakeholderService>();
            builder.Services.AddScoped<IExpenseCategoryService, ExpenseCategoryService>();
            builder.Services.AddScoped<IFinancialReportService, fatortak.Services.FinancialReportService.FinancialReportService>();
            #endregion


            builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(option =>
            {
                // Password settings.
                option.Password.RequireDigit = true;
                option.Password.RequireLowercase = true;
                option.Password.RequireNonAlphanumeric = true;
                option.Password.RequireUppercase = true;
                option.Password.RequiredLength = 12;
                option.Password.RequiredUniqueChars = 4;
                option.Lockout.MaxFailedAccessAttempts = 5;
                option.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                option.User.RequireUniqueEmail = true;
            })
             .AddEntityFrameworkStores<ApplicationDbContext>()
             .AddDefaultTokenProviders();


            #region Jwt Config

            var jwtSettings = builder.Configuration.GetSection("Jwt");
            var jwtKey = jwtSettings["Key"];
            if (string.IsNullOrWhiteSpace(jwtKey) ||
                Encoding.UTF8.GetByteCount(jwtKey) < 32 ||
                jwtKey.Contains("your-very-secure-key", StringComparison.OrdinalIgnoreCase) ||
                jwtKey.Contains("REPLACE_WITH", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "Jwt:Key must be a random secret of at least 32 bytes. " +
                    "Set Jwt__Key or Jwt:Key in your environment/user secrets.");
            }

            var key = Encoding.UTF8.GetBytes(jwtKey);

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = true;
                options.SaveToken = true;
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        // Browser clients use the HttpOnly cookie. API clients
                        // can continue to use the Authorization header.
                        if (string.IsNullOrEmpty(context.Request.Headers.Authorization) &&
                            context.Request.Cookies.TryGetValue("fatortak_at", out var cookieToken))
                        {
                            context.Token = cookieToken;
                        }

                        return Task.CompletedTask;
                    }
                };
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(key)
                };
            });

            builder.Services.AddAuthorization(options =>
            {
                // Every endpoint requires an authenticated user unless it is
                // explicitly marked with [AllowAnonymous].
                options.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            });

            #endregion

            var app = builder.Build();

            app.UseMiddleware<ExceptionHandlingMiddleware>();

            app.Use(async (context, next) =>
            {
                context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                context.Response.Headers["X-Frame-Options"] = "DENY";
                context.Response.Headers["Referrer-Policy"] = "no-referrer";
                context.Response.Headers["Permissions-Policy"] =
                    "camera=(), microphone=(), geolocation=(), payment=()";
                await next();
            });

            if (!app.Environment.IsDevelopment())
            {
                app.UseHsts();
            }

            app.UseCors("AppCors");

            var httpContextAccessor = app.Services.GetRequiredService<IHttpContextAccessor>();
            UserHelper.Configure(httpContextAccessor);
            EmailHelper.Initialize(builder.Configuration);

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseMiddleware<TenantResolutionMiddleware>();
            app.UseAuthorization();
            app.UseRateLimiter();
            // app.UseMiddleware<SubscriptionValidationMiddleware>();

            app.UseStaticFiles(new StaticFileOptions
            {
                OnPrepareResponse = ctx =>
                {
                    // Never let a browser render a stored upload as active content.
                    if (ctx.Context.Request.Path.StartsWithSegments("/uploads"))
                    {
                        ctx.Context.Response.Headers["Content-Disposition"] = "attachment";
                        ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
                    }
                }
            });

            app.MapGet("/health", () => Results.Ok(new
            {
                status = "ok",
                service = "fatortak-api",
                timestamp = DateTime.UtcNow
            })).AllowAnonymous();

            app.MapGet("/ready", async (ApplicationDbContext db) =>
            {
                var canConnect = await db.Database.CanConnectAsync();
                return canConnect
                    ? Results.Ok(new { status = "ready", database = "ok" })
                    : Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            }).AllowAnonymous();

            app.MapControllers();

            // Seed data on startup
            try
            {
                SeedingAdminUser.Seed(app).GetAwaiter().GetResult();

                // Seed Chart of Accounts for all existing tenants
                using (var scope = app.Services.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    try
                    {
                        Seeding.AccountSeeder.SeedAccountsAsync(context).GetAwaiter().GetResult();
                        Console.WriteLine("Chart of Accounts seeded successfully for all tenants.");

                        // Backfill Expense Categories
                        var expenseCategoryService = scope.ServiceProvider.GetRequiredService<IExpenseCategoryService>();
                        var tenants = context.Tenants.ToList();
                        foreach (var tenant in tenants)
                        {
                            expenseCategoryService.SeedDefaultCategoriesAsync(tenant.Id).GetAwaiter().GetResult();
                        }
                        Console.WriteLine("Expense Categories backfilled successfully for all tenants.");

                        // Fix Previous Invoice Numbers
                        Seeding.InvoiceNumberSeeder.FixInvoiceNumbersAsync(context).GetAwaiter().GetResult();
                        Console.WriteLine("Invoices re-sequenced successfully for all tenants.");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error seeding Chart of Accounts, Categories, or Invoices: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during seeding: {ex.Message}");
            }

            app.Run();
        }
    }
}

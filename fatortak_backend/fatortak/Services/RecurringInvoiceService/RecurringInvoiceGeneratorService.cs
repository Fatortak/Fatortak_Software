using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace fatortak.Services.RecurringInvoiceService
{
    public class RecurringInvoiceGeneratorService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RecurringInvoiceGeneratorService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromHours(6);

        public RecurringInvoiceGeneratorService(
            IServiceProvider serviceProvider,
            ILogger<RecurringInvoiceGeneratorService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Recurring invoice generator is starting.");
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var service = scope.ServiceProvider.GetRequiredService<IRecurringInvoiceService>();
                    var generated = await service.GenerateAllDueAsync();
                    if (generated > 0)
                        _logger.LogInformation("Generated {Count} recurring invoices", generated);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error generating recurring invoices");
                }

                await Task.Delay(_interval, stoppingToken);
            }
            _logger.LogInformation("Recurring invoice generator is stopping.");
        }
    }
}

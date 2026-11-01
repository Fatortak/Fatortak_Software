using fatortak.Dtos.Stakeholder;
using fatortak.Services.StakeholderService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace fatortak.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class StakeholdersController : ControllerBase
    {
        private readonly IStakeholderService _service;

        public StakeholdersController(IStakeholderService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id)
        {
            var result = await _service.GetByIdAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateStakeholderDto dto)
        {
            var result = await _service.CreateAsync(dto);
            return result.Success
                ? CreatedAtAction(nameof(Get), new { id = result.Data?.Id }, result)
                : BadRequest(result);
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStakeholderDto dto)
        {
            var result = await _service.UpdateAsync(id, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _service.DeleteAsync(id);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id:guid}/transactions")]
        public async Task<IActionResult> GetTransactions(Guid id)
        {
            var result = await _service.GetTransactionsAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpPost("{id:guid}/transactions")]
        public async Task<IActionResult> AddTransaction(
            Guid id, [FromBody] CreateStakeholderTransactionDto dto)
        {
            var result = await _service.AddTransactionAsync(id, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("transactions/{transactionId:guid}")]
        public async Task<IActionResult> DeleteTransaction(Guid transactionId)
        {
            var result = await _service.DeleteTransactionAsync(transactionId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{id:guid}/statement")]
        public async Task<IActionResult> GetStatement(Guid id)
        {
            var result = await _service.GetStatementAsync(id);
            return result.Success ? Ok(result) : NotFound(result);
        }

        [HttpGet("{id:guid}/statement/export")]
        public async Task<IActionResult> ExportStatement(Guid id)
        {
            var result = await _service.GetStatementAsync(id);
            if (!result.Success || result.Data == null) return NotFound(result);

            var statement = result.Data;
            var builder = new System.Text.StringBuilder();
            builder.AppendLine("Stakeholder,Type,Date,TransactionType,Amount,Reference,Description");
            foreach (var transaction in statement.Transactions.OrderBy(t => t.Date))
            {
                var values = new[]
                {
                    statement.Stakeholder.Name,
                    statement.Stakeholder.Type.ToString(),
                    transaction.Date.ToString("yyyy-MM-dd"),
                    transaction.Type.ToString(),
                    transaction.Amount.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture),
                    transaction.Reference ?? string.Empty,
                    transaction.Description ?? string.Empty
                };
                builder.AppendLine(string.Join(",", values.Select(EscapeCsv)));
            }
            builder.AppendLine();
            builder.AppendLine($"Capital balance,{statement.CapitalBalance:0.00}");
            builder.AppendLine($"Loan balance,{statement.LoanBalance:0.00}");
            builder.AppendLine($"Net position,{statement.NetPosition:0.00}");

            var safeName = string.Concat(statement.Stakeholder.Name
                .Where(ch => char.IsLetterOrDigit(ch) || ch is '-' or '_'))
                .Trim();
            return File(
                System.Text.Encoding.UTF8.GetBytes(builder.ToString()),
                "text/csv",
                $"stakeholder-statement-{safeName}.csv");
        }

        private static string EscapeCsv(string value)
        {
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
                return $"\"{value.Replace("\"", "\"\"")}\"";
            return value;
        }
    }
}

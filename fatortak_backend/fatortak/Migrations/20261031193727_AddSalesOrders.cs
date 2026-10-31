using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fatortak.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmedAt",
                schema: "dbo",
                table: "Quotations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DocumentType",
                schema: "dbo",
                table: "Quotations",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "SourceQuotationId",
                schema: "dbo",
                table: "Quotations",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_TenantId_DocumentType",
                schema: "dbo",
                table: "Quotations",
                columns: new[] { "TenantId", "DocumentType" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Quotations_TenantId_DocumentType",
                schema: "dbo",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "ConfirmedAt",
                schema: "dbo",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "DocumentType",
                schema: "dbo",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "SourceQuotationId",
                schema: "dbo",
                table: "Quotations");
        }
    }
}

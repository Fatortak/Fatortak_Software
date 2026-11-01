using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fatortak.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierBillMatching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BilledQuantity",
                schema: "dbo",
                table: "PurchaseOrderItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "GoodsReceiptNoteId",
                schema: "dbo",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderId",
                schema: "dbo",
                table: "Invoices",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupplierInvoiceNumber",
                schema: "dbo",
                table: "Invoices",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PurchaseOrderItemId",
                schema: "dbo",
                table: "InvoiceItems",
                type: "uniqueidentifier",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BilledQuantity",
                schema: "dbo",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "GoodsReceiptNoteId",
                schema: "dbo",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderId",
                schema: "dbo",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "SupplierInvoiceNumber",
                schema: "dbo",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderItemId",
                schema: "dbo",
                table: "InvoiceItems");
        }
    }
}

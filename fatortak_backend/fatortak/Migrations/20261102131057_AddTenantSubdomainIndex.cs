using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace fatortak.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantSubdomainIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Older deployments allowed arbitrary subdomains. Keep the column
            // within the new limit and clear any duplicates before adding the
            // unique index so the migration cannot fail on legacy data.
            migrationBuilder.Sql(@"
UPDATE [dbo].[Tenants]
SET [Subdomain] = LEFT([Subdomain], 30)
WHERE [Subdomain] IS NOT NULL AND LEN([Subdomain]) > 30;

WITH ranked AS (
    SELECT [Id],
           ROW_NUMBER() OVER (PARTITION BY LOWER([Subdomain]) ORDER BY [CreatedAt], [Id]) AS [rn]
    FROM [dbo].[Tenants]
    WHERE [Subdomain] IS NOT NULL
)
UPDATE t
SET t.[Subdomain] = NULL
FROM [dbo].[Tenants] t
INNER JOIN ranked r ON t.[Id] = r.[Id]
WHERE r.[rn] > 1;
");

            migrationBuilder.AlterColumn<string>(
                name: "Subdomain",
                schema: "dbo",
                table: "Tenants",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_Subdomain",
                schema: "dbo",
                table: "Tenants",
                column: "Subdomain",
                unique: true,
                filter: "[Subdomain] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tenants_Subdomain",
                schema: "dbo",
                table: "Tenants");

            migrationBuilder.AlterColumn<string>(
                name: "Subdomain",
                schema: "dbo",
                table: "Tenants",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(30)",
                oldMaxLength: 30,
                oldNullable: true);
        }
    }
}

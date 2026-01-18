using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalWise.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLandandTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Tenants",
                newName: "LastName");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "LandLords",
                newName: "LastName");

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "Tenants",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "LandLords",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "LandLords");

            migrationBuilder.RenameColumn(
                name: "LastName",
                table: "Tenants",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "LastName",
                table: "LandLords",
                newName: "FullName");
        }
    }
}

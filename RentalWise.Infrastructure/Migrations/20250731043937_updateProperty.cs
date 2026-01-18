using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalWise.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class updateProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Broadband",
                table: "Properties",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Properties",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Furnishings",
                table: "Properties",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "MaximumTenants",
                table: "Properties",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "SmokeAlarm",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Broadband",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "Furnishings",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "MaximumTenants",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SmokeAlarm",
                table: "Properties");
        }
    }
}

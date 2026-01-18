using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalWise.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToLandlordagain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "LandLords",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "LandLords");
        }
    }
}

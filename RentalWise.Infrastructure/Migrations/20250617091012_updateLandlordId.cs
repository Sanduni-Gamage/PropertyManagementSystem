using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalWise.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class updateLandlordId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leases_LandLords_LandlordId",
                table: "Leases");

            migrationBuilder.DropForeignKey(
                name: "FK_Properties_LandLords_UserId",
                table: "Properties");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LandLords",
                table: "LandLords");

            migrationBuilder.DropIndex(
                name: "IX_LandLords_UserId",
                table: "LandLords");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "LandLords");

            migrationBuilder.RenameColumn(
                name: "LandlordId",
                table: "Leases",
                newName: "LandlordUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Leases_LandlordId",
                table: "Leases",
                newName: "IX_Leases_LandlordUserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LandLords",
                table: "LandLords",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Leases_LandLords_LandlordUserId",
                table: "Leases",
                column: "LandlordUserId",
                principalTable: "LandLords",
                principalColumn: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_LandLords_UserId",
                table: "Properties",
                column: "UserId",
                principalTable: "LandLords",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Leases_LandLords_LandlordUserId",
                table: "Leases");

            migrationBuilder.DropForeignKey(
                name: "FK_Properties_LandLords_UserId",
                table: "Properties");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LandLords",
                table: "LandLords");

            migrationBuilder.RenameColumn(
                name: "LandlordUserId",
                table: "Leases",
                newName: "LandlordId");

            migrationBuilder.RenameIndex(
                name: "IX_Leases_LandlordUserId",
                table: "Leases",
                newName: "IX_Leases_LandlordId");

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "LandLords",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddPrimaryKey(
                name: "PK_LandLords",
                table: "LandLords",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_LandLords_UserId",
                table: "LandLords",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Leases_LandLords_LandlordId",
                table: "Leases",
                column: "LandlordId",
                principalTable: "LandLords",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_LandLords_UserId",
                table: "Properties",
                column: "UserId",
                principalTable: "LandLords",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

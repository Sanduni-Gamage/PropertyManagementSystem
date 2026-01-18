using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentalWise.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLandlordId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_LandLords_LandlordId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_LandlordId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "LandlordId",
                table: "Properties");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_LandLords_UserId",
                table: "Properties",
                column: "UserId",
                principalTable: "LandLords",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_LandLords_UserId",
                table: "Properties");

            migrationBuilder.AddColumn<Guid>(
                name: "LandlordId",
                table: "Properties",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Properties_LandlordId",
                table: "Properties",
                column: "LandlordId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_LandLords_LandlordId",
                table: "Properties",
                column: "LandlordId",
                principalTable: "LandLords",
                principalColumn: "Id");
        }
    }
}

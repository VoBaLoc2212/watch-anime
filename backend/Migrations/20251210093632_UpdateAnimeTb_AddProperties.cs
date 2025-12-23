using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAnimeTb_AddProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Animes",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AnimeName",
                table: "Animes",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedById",
                table: "Animes",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "Genres",
                table: "Animes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReleaseYear",
                table: "Animes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Animes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Studio",
                table: "Animes",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TotalEpisodes",
                table: "Animes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Animes_CreatedById",
                table: "Animes",
                column: "CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Animes_Users_CreatedById",
                table: "Animes",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Animes_Users_CreatedById",
                table: "Animes");

            migrationBuilder.DropIndex(
                name: "IX_Animes_CreatedById",
                table: "Animes");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Animes");

            migrationBuilder.DropColumn(
                name: "Genres",
                table: "Animes");

            migrationBuilder.DropColumn(
                name: "ReleaseYear",
                table: "Animes");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Animes");

            migrationBuilder.DropColumn(
                name: "Studio",
                table: "Animes");

            migrationBuilder.DropColumn(
                name: "TotalEpisodes",
                table: "Animes");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Animes",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "AnimeName",
                table: "Animes",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}

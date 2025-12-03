using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateVideoTableToAnime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Episodes_Videos_AnimeId",
                table: "Episodes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Videos",
                table: "Videos");

            migrationBuilder.RenameTable(
                name: "Videos",
                newName: "Animes");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Animes",
                table: "Animes",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Episodes_Animes_AnimeId",
                table: "Episodes",
                column: "AnimeId",
                principalTable: "Animes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Episodes_Animes_AnimeId",
                table: "Episodes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Animes",
                table: "Animes");

            migrationBuilder.RenameTable(
                name: "Animes",
                newName: "Videos");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Videos",
                table: "Videos",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Episodes_Videos_AnimeId",
                table: "Episodes",
                column: "AnimeId",
                principalTable: "Videos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRatingsPropertiesTableToDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_Animes_AnimeId",
                table: "Ratings");

            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_Users_UserId",
                table: "Ratings");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Ratings",
                newName: "ReportedAnimeId");

            migrationBuilder.RenameColumn(
                name: "AnimeId",
                table: "Ratings",
                newName: "CreatedById");

            migrationBuilder.RenameIndex(
                name: "IX_Ratings_UserId",
                table: "Ratings",
                newName: "IX_Ratings_ReportedAnimeId");

            migrationBuilder.RenameIndex(
                name: "IX_Ratings_AnimeId",
                table: "Ratings",
                newName: "IX_Ratings_CreatedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_Animes_ReportedAnimeId",
                table: "Ratings",
                column: "ReportedAnimeId",
                principalTable: "Animes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_Users_CreatedById",
                table: "Ratings",
                column: "CreatedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_Animes_ReportedAnimeId",
                table: "Ratings");

            migrationBuilder.DropForeignKey(
                name: "FK_Ratings_Users_CreatedById",
                table: "Ratings");

            migrationBuilder.RenameColumn(
                name: "ReportedAnimeId",
                table: "Ratings",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "CreatedById",
                table: "Ratings",
                newName: "AnimeId");

            migrationBuilder.RenameIndex(
                name: "IX_Ratings_ReportedAnimeId",
                table: "Ratings",
                newName: "IX_Ratings_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Ratings_CreatedById",
                table: "Ratings",
                newName: "IX_Ratings_AnimeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_Animes_AnimeId",
                table: "Ratings",
                column: "AnimeId",
                principalTable: "Animes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Ratings_Users_UserId",
                table: "Ratings",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jadify.API.Shared.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessReminderHoursBefore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ReminderHoursBefore",
                table: "Businesses",
                type: "integer",
                nullable: false,
                defaultValue: 24);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ReminderHoursBefore",
                table: "Businesses");
        }
    }
}

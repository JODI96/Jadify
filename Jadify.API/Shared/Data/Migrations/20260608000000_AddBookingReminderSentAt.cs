using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jadify.API.Shared.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingReminderSentAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ReminderSentAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_StartTime_ReminderSentAt",
                table: "Bookings",
                columns: new[] { "StartTime", "ReminderSentAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_StartTime_ReminderSentAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ReminderSentAt",
                table: "Bookings");
        }
    }
}

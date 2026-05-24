using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jadify.API.Shared.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultBusinessHours : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // For every business that has zero BusinessHours rows, insert the
            // default schedule: Mon–Sat 09:00–18:00, Sunday closed.
            migrationBuilder.Sql(@"
INSERT INTO ""BusinessHours"" (""Id"", ""BusinessId"", ""DayOfWeek"", ""OpenTime"", ""CloseTime"", ""IsClosed"")
SELECT
    gen_random_uuid(),
    b.""Id"",
    d.day,
    '09:00:00',
    '18:00:00',
    CASE WHEN d.day = 0 THEN TRUE ELSE FALSE END
FROM ""Businesses"" b
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d(day)
WHERE NOT EXISTS (
    SELECT 1 FROM ""BusinessHours"" bh WHERE bh.""BusinessId"" = b.""Id""
);
");
        }

        protected override void Down(MigrationBuilder migrationBuilder) { }
    }
}

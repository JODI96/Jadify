namespace Jadify.API.Shared.Models;

public class StaffHours
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StaffId { get; set; }
    public Staff Staff { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public bool IsWorking { get; set; } = true;
}

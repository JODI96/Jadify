namespace Jadify.API.Shared.Models;

/// <summary>Join table linking staff members to the services they can perform.</summary>
public class StaffService
{
    public Guid StaffId { get; set; }
    public Staff Staff { get; set; } = null!;

    public Guid ServiceId { get; set; }
    public Service Service { get; set; } = null!;
}

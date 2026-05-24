namespace Jadify.API.Shared.Models;

public class Staff
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BusinessId { get; set; }
    public Business Business { get; set; } = null!;

    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StaffService> StaffServices { get; set; } = new List<StaffService>();
    public ICollection<StaffHours> StaffHours { get; set; } = new List<StaffHours>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

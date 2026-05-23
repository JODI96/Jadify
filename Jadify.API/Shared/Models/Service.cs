namespace Jadify.API.Shared.Models;

public class Service
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BusinessId { get; set; }
    public Business Business { get; set; } = null!;

    public required string Name { get; set; }
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<StaffService> StaffServices { get; set; } = new List<StaffService>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}

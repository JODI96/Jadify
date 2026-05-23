using Jadify.API.Shared.Enums;
using Microsoft.AspNetCore.Identity;

namespace Jadify.API.Shared.Models;

public class Business
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Name { get; set; }
    public BusinessType Type { get; set; }

    /// <summary>FK to AspNetUsers (IdentityUser.Id)</summary>
    public required string OwnerId { get; set; }
    public IdentityUser? Owner { get; set; }

    public required string Slug { get; set; }
    public required string Address { get; set; }
    public required string Phone { get; set; }
    public required string Email { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<BusinessHours> BusinessHours { get; set; } = new List<BusinessHours>();
    public ICollection<Staff> Staff { get; set; } = new List<Staff>();
    public ICollection<Service> Services { get; set; } = new List<Service>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public Subscription? Subscription { get; set; }
}

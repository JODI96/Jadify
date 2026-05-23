using Jadify.API.Shared.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Jadify.API.Shared.Data;

public class JadifyDbContext(DbContextOptions<JadifyDbContext> options)
    : IdentityDbContext<IdentityUser>(options)
{
    public DbSet<Business>      Businesses    => Set<Business>();
    public DbSet<BusinessHours> BusinessHours => Set<BusinessHours>();
    public DbSet<Staff>         Staff         => Set<Staff>();
    public DbSet<Service>       Services      => Set<Service>();
    public DbSet<StaffService>  StaffServices => Set<StaffService>();
    public DbSet<Booking>       Bookings      => Set<Booking>();
    public DbSet<Customer>      Customers     => Set<Customer>();
    public DbSet<Subscription>  Subscriptions => Set<Subscription>();
    public DbSet<Payment>       Payments      => Set<Payment>();
    public DbSet<Table>         Tables        => Set<Table>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        ConfigureBusiness(builder);
        ConfigureBusinessHours(builder);
        ConfigureStaff(builder);
        ConfigureService(builder);
        ConfigureStaffService(builder);
        ConfigureBooking(builder);
        ConfigureCustomer(builder);
        ConfigureSubscription(builder);
        ConfigurePayment(builder);
        ConfigureTable(builder);
    }

    private static void ConfigureBusiness(ModelBuilder builder)
    {
        builder.Entity<Business>(e =>
        {
            e.HasIndex(b => b.Slug).IsUnique();

            // FK to ASP.NET Identity user — no cascade (prevent orphaned Identity rows)
            e.HasOne(b => b.Owner)
             .WithMany()
             .HasForeignKey(b => b.OwnerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.Property(b => b.Type).HasConversion<string>();
        });
    }

    private static void ConfigureBusinessHours(ModelBuilder builder)
    {
        builder.Entity<BusinessHours>(e =>
        {
            e.HasOne(bh => bh.Business)
             .WithMany(b => b.BusinessHours)
             .HasForeignKey(bh => bh.BusinessId)
             .OnDelete(DeleteBehavior.Cascade);

            // Availability queries filter by business + day
            e.HasIndex(bh => new { bh.BusinessId, bh.DayOfWeek });
        });
    }

    private static void ConfigureStaff(ModelBuilder builder)
    {
        builder.Entity<Staff>(e =>
        {
            e.HasOne(s => s.Business)
             .WithMany(b => b.Staff)
             .HasForeignKey(s => s.BusinessId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureService(ModelBuilder builder)
    {
        builder.Entity<Service>(e =>
        {
            e.HasOne(s => s.Business)
             .WithMany(b => b.Services)
             .HasForeignKey(s => s.BusinessId)
             .OnDelete(DeleteBehavior.Cascade);

            e.Property(s => s.Price).HasPrecision(18, 2);
        });
    }

    private static void ConfigureStaffService(ModelBuilder builder)
    {
        builder.Entity<StaffService>(e =>
        {
            e.HasKey(ss => new { ss.StaffId, ss.ServiceId });

            e.HasOne(ss => ss.Staff)
             .WithMany(s => s.StaffServices)
             .HasForeignKey(ss => ss.StaffId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(ss => ss.Service)
             .WithMany(s => s.StaffServices)
             .HasForeignKey(ss => ss.ServiceId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureBooking(ModelBuilder builder)
    {
        builder.Entity<Booking>(e =>
        {
            // Use Restrict on all Booking FKs — bookings are financial records
            // and must never be silently deleted when a parent is removed.
            e.HasOne(b => b.Business)
             .WithMany(b => b.Bookings)
             .HasForeignKey(b => b.BusinessId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(b => b.Staff)
             .WithMany(s => s.Bookings)
             .HasForeignKey(b => b.StaffId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(b => b.Service)
             .WithMany(s => s.Bookings)
             .HasForeignKey(b => b.ServiceId)
             .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(b => b.Customer)
             .WithMany(c => c.Bookings)
             .HasForeignKey(b => b.CustomerId)
             .OnDelete(DeleteBehavior.Restrict);

            e.Property(b => b.TotalAmount).HasPrecision(18, 2);
            e.Property(b => b.FeeAmount).HasPrecision(18, 2);
            e.Property(b => b.Status).HasConversion<string>();

            // Primary availability query: bookings for a business on a given day
            e.HasIndex(b => new { b.BusinessId, b.StartTime });
            // Secondary: per-staff slot conflict detection
            e.HasIndex(b => new { b.StaffId, b.StartTime });
        });
    }

    private static void ConfigureCustomer(ModelBuilder builder)
    {
        builder.Entity<Customer>(e =>
        {
            e.HasIndex(c => c.Email).IsUnique();
        });
    }

    private static void ConfigureSubscription(ModelBuilder builder)
    {
        builder.Entity<Subscription>(e =>
        {
            // One subscription per business
            e.HasOne(s => s.Business)
             .WithOne(b => b.Subscription)
             .HasForeignKey<Subscription>(s => s.BusinessId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(s => s.BusinessId).IsUnique();
            e.Property(s => s.Tier).HasConversion<string>();
        });
    }

    private static void ConfigurePayment(ModelBuilder builder)
    {
        builder.Entity<Payment>(e =>
        {
            // One payment record per booking
            e.HasOne(p => p.Booking)
             .WithOne(b => b.Payment)
             .HasForeignKey<Payment>(p => p.BookingId)
             .OnDelete(DeleteBehavior.Restrict);

            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.Property(p => p.FeeAmount).HasPrecision(18, 2);
        });
    }

    private static void ConfigureTable(ModelBuilder builder)
    {
        builder.Entity<Table>(e =>
        {
            e.HasOne(t => t.Business)
             .WithMany(b => b.Tables)
             .HasForeignKey(t => t.BusinessId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(t => t.BusinessId);
        });
    }
}

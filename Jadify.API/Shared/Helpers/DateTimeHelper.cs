namespace Jadify.API.Shared.Helpers;

public static class DateTimeHelper
{
    /// <summary>Ensures a DateTime is stored as UTC regardless of how it arrived.</summary>
    public static DateTime EnsureUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

    /// <summary>
    /// Yields the start of every slot of <paramref name="durationMinutes"/> that fits
    /// completely within [<paramref name="open"/>, <paramref name="close"/>).
    /// </summary>
    public static IEnumerable<DateTime> GenerateSlots(
        DateTime open, DateTime close, int durationMinutes)
    {
        var current = open;
        while (current.AddMinutes(durationMinutes) <= close)
        {
            yield return current;
            current = current.AddMinutes(durationMinutes);
        }
    }

    /// <summary>Combines a date and a TimeOnly into a UTC DateTime.</summary>
    public static DateTime Combine(DateOnly date, TimeOnly time)
        => DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Utc);
}

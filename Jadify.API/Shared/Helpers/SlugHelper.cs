using System.Text.RegularExpressions;

namespace Jadify.API.Shared.Helpers;

public static partial class SlugHelper
{
    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex NonSlugCharacters();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceRun();

    [GeneratedRegex(@"-{2,}")]
    private static partial Regex RepeatedDashes();

    /// <summary>Converts a display name into a URL-safe slug, e.g. "Salon Zürich" → "salon-zurich".</summary>
    public static string Generate(string input)
    {
        var slug = input.ToLowerInvariant()
            .Replace("ä", "ae").Replace("ö", "oe").Replace("ü", "ue")
            .Replace("à", "a").Replace("â", "a").Replace("é", "e")
            .Replace("è", "e").Replace("ê", "e").Replace("î", "i")
            .Replace("ô", "o").Replace("û", "u").Replace("ç", "c");

        slug = NonSlugCharacters().Replace(slug, "");
        slug = WhitespaceRun().Replace(slug, "-");
        slug = RepeatedDashes().Replace(slug, "-");
        return slug.Trim('-');
    }

    /// <summary>Appends a short suffix to make a slug unique, e.g. "salon-zurich-a1b2".</summary>
    public static string MakeUnique(string baseSlug)
        => $"{baseSlug}-{Guid.NewGuid().ToString("N")[..6]}";
}

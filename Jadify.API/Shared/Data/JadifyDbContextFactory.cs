using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Jadify.API.Shared.Data;

/// <summary>
/// Allows EF Core CLI tools (dotnet ef migrations add) to instantiate
/// JadifyDbContext at design time without a running application host.
/// </summary>
public class JadifyDbContextFactory : IDesignTimeDbContextFactory<JadifyDbContext>
{
    public JadifyDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<JadifyDbContext>()
            .UseNpgsql("Host=localhost;Database=jadify;Username=postgres;Password=1212")
            .Options;

        return new JadifyDbContext(options);
    }
}

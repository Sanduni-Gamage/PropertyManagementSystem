using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using RentalWise.Domain.Entities;

namespace RentalWise.Infrastructure.SeedData;

public static class IdentitySeeder
{
    public static async Task SeedRolesAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        string[] roles = { "Tenant", "Landlord" };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new ApplicationRole(role));
            }
        }
    }
}

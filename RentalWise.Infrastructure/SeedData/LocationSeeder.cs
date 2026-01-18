using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RentalWise.Infrastructure.SeedData;

public static class LocationSeeder
{
    public static async Task SeedLocations(AppDbContext context)
    {
        if (context.Regions.Any()) return; // already seeded

        var jsonPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "SeedData", "locations-nz.json");
        var json = await File.ReadAllTextAsync(jsonPath);
        var regions = JsonSerializer.Deserialize<List<RegionSeedModel>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        foreach (var regionModel in regions!)
        {
            if (string.IsNullOrWhiteSpace(regionModel.Name))
            {
                Console.WriteLine("Found region with null or empty name!");
                continue;
            }
            var region = new Region { Name = regionModel.Name };

            foreach (var districtModel in regionModel.Districts)
            {
                if (string.IsNullOrWhiteSpace(districtModel.Name))
                {
                    Console.WriteLine($"Found district with null or empty name in region {regionModel.Name}");
                    continue;
                }
                var district = new District { Name = districtModel.Name };
                foreach (var suburbName in districtModel.Suburbs)
                {
                    district.Suburbs.Add(new Suburb { Name = suburbName });
                }

                region.Districts.Add(district);
            }

            context.Regions.Add(region);
        }

        await context.SaveChangesAsync();
    }

    private class RegionSeedModel
    {
        public string Name { get; set; } = null!;
        public List<DistrictSeedModel> Districts { get; set; } = new();
    }

    private class DistrictSeedModel
    {
        public string Name { get; set; } = null!;
        public List<string> Suburbs { get; set; } = new();
    }
}

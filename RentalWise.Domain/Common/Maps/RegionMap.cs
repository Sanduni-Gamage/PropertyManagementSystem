using RentalWise.Domain.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Common.Maps;

public static class RegionMap
{
    public static readonly Dictionary<Region, Dictionary<string, List<string>>> Data =
        new()
        {
            {
                Region.Auckland, new Dictionary<string, List<string>>
                {
                    { "Auckland City", new() { "Arch Hill", "Avondale", "Balmoral", "Blockhouse Bay", "City Center", "Cox Bay", "Eden Terrace", "Epsom", "Ellerslie", "Freemans Bay", "Glen Innes", "Greenlane", "Herne Bay", "Hillsborough", "Kingsland", "Lynfield", "Mission Bay",  "Ponsonby", "Grey Lynn", "Grafton", "Mount Albert", "Mount Eden", "Mount Roskill", "Mount Wellington", 
                                               "Eden Terrace", "Newmarket", "Onehunga", "Penrose", "Ponsonby", "Royal Oak", "Sandringham", 
                                               "St Lukes", ""} },
                    { "Frankiln", new() { "Aka Aka", "Buckland", "Glenbrook", "Kingseat", "Pukekohe" } },
                    { "Manukau", new() { "Papatoetoe", "Otara", "Manurewa", "City Center", "Mangere East" } },
                    { "Northshore City", new() { "Albany", "Browns Bay", "Devonport", "Mairangi Bay", "Rothesay Bay" } },
                    { "Papakura", new() { "Ardmore", "Papakura", "Rosehill", "Takanini", "Drury" } },
                    { "Rodney", new() { "Albany Heights", "Helensville", "Manly", "Omaha", "Puhoi" } },
                    { "Manukau", new() { "Papatoetoe", "Otara", "Manurewa" } }
                }
            },
            {
                Region.Northland, new Dictionary<string, List<string>>
                {
                    { "Far North", new() { "Ahipara", "Cable Bay", "Fairburn", "Hihi", "Towai" } },
                    { "Kaipara", new() { "Aranga", "Hakaru", "Matakohe",  } }
                }
            },
            {
                Region.HawkesBay, new Dictionary<string, List<string>>
                {
                    { "Napier", new() { "Ahuriri", "Onekawa", "Taradale" } },
                    { "Hastings", new() { "Mahora", "Parkvale", "Havelock North" } }
                }
            }
        };
}

using RentalWise.Domain.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Interfaces
{
    public class PropertySearchFilter
    {
        public string? Keyword { get; set; }
        public int? RegionId { get; set; }
        public int? DistrictId { get; set; }
        public List<int>? SuburbIds { get; set; }

        public int? Bedrooms { get; set; }
        public int? Bathrooms { get; set; }
        public int? ParkingSpaces { get; set; }

        public int? MinRent { get; set; }
        public int? MaxRent { get; set; }

        public DateTime? MoveInDate { get; set; }

        public List<int>? PropertyTypes { get; set; }
        public bool? PetsAllowed { get; set; }
        public int? PropertyFeatures { get; set; } // [Flags] int value
        public string? SortBy { get; set; } // "price-asc", "price-desc", "latest"
        public int PageNumber { get; set; }
        public int PageSize { get; set; }

    }
}

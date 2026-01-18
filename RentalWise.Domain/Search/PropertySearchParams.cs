using RentalWise.Domain.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.DTOs.Search;

public class PropertySearchParams
{
    public string? Keyword { get; set; }
    public int? RegionId { get; set; }
    public int? DistrictId { get; set; }
    public int? SuburbId { get; set; }
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public int? ParkingSpaces { get; set; }
    public decimal? MinRent { get; set; }
    public decimal? MaxRent { get; set; }
    public bool? PetsAllowed { get; set; }
    public PropertyType? PropertyType { get; set; }
    public PropertyFeatures? Features { get; set; }

    public DateTime? MoveInDate { get; set; } // NEW

    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

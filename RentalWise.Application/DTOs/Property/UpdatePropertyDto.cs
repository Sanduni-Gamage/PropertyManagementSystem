using Microsoft.AspNetCore.Http;
using RentalWise.Domain.Enum;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.DTOs.Property;

public class UpdatePropertyDto
{
    [Required]
    public string Name { get; set; } = null!;
    [Required]
    public string Address { get; set; } = null!;

    public int SuburbId { get; set; }
    public decimal RentAmount { get; set; }
    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public int ParkingSpaces { get; set; }

    public PropertyType PropertyType { get; set; }
    public PropertyFeatures Features { get; set; }
    public bool PetsAllowed { get; set; }
    public DateTime AvailableDate { get; set; }

    public string Furnishings { get; set; } = null!;
    public int MaximumTenants { get; set; }

    public BroadbandTypes Broadband { get; set; }

    public bool SmokeAlarm { get; set; }

    public string Description { get; set; } = null!;
    public double Latitude { get; set; }  
    public double Longitude { get; set; }

    public List<IFormFile>? Images { get; set; }
    public IFormFile? Video { get; set; }

    public List<int>? RemovedMediaIds { get; set; }
}

using RentalWise.Domain.Enum;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class Property
{
    public int Id { get; set; }

    // Foreign Key to Identity User
    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public ApplicationUser User { get; set; } = null!;

    // landlord via UserId
    [Required]
    public Guid LandlordId { get; set; }

    [ForeignKey("LandlordId")]
    public Landlord Landlord { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public int SuburbId { get; set; }
    public Suburb Suburb { get; set; } = null!;
    public decimal RentAmount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int Bedrooms { get; set; }
    public int Bathrooms { get; set; }
    public int ParkingSpaces { get; set; }

    public PropertyType PropertyType { get; set; }
    public PropertyFeatures Features { get; set; } = PropertyFeatures.None;

    public bool PetsAllowed { get; set; } = false;
    public DateTime AvailableDate { get; set; }

    public string Furnishings { get; set; } = null!;

    public int MaximumTenants { get; set; }

    public BroadbandTypes Broadband { get; set; } = BroadbandTypes.None;

    public bool SmokeAlarm { get; set; } = false;

    public string Description { get; set; } = null!;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool IsActive { get; set; } = true;


    public ICollection<PropertyMedia> Media { get; set; } = new List<PropertyMedia>();

    public ICollection<Lease> Leases { get; set; } = new List<Lease>();
}

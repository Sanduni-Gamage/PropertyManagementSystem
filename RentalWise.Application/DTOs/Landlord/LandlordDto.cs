using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.DTOs.Landlord;

public class LandlordDto
{
    public Guid UserId { get; set; }
    public Guid Id { get; set; } // Landlord table primary key
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? Gender { get; set; }

    [Phone]
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public string? Suburb { get; set; }
    public string? City { get; set; }

    public int? PostCode { get; set; }
}

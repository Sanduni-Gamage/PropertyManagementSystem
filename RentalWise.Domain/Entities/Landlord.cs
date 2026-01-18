using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class Landlord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // Foreign Key to Identity User
    [Required]
    public Guid UserId { get; set; }

    public ApplicationUser User { get; set; } = null!;

    
    public string? FirstName { get; set; } 
    public string? LastName { get; set; } 
    public string? Gender { get; set; }
    public string? ContactNumber { get; set; }
    public string? Address { get; set; }
    public string? Suburb { get; set; }
    public string? City { get; set; }
    public int? PostCode { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Property> Properties { get; set; } = new List<Property>();
    public ICollection<Lease> Leases { get; set; } = new List<Lease>();

}

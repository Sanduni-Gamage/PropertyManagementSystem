using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class Tenant
{
    [Key]
    [ForeignKey("UserId")]
    public Guid Id { get; set; }

    // Foreign Key to Identity User
    [Required]
    public Guid UserId { get; set; }

    [ForeignKey("UserId")]
    public ApplicationUser User { get; set; } = null!;

    public string? FirstName { get; set; } 
    public string? LastName { get; set; } 
    public string? Gender { get; set; }
    public string? PhoneNumber { get; set; } 
    public string? Address { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Lease> Leases { get; set; } = new List<Lease>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

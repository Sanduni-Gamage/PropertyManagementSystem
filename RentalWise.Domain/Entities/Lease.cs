using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class Lease
{
    [Key]
    public int Id { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal RentAmount { get; set; }
    public string? Notes { get; set; }
    
    [Required]
    public int PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}

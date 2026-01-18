using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    // Common Fields
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    // One-to-One navigation
    public Landlord? Landlord { get; set; }
    public Tenant? Tenant { get; set; }


}

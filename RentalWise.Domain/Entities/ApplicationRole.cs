using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class ApplicationRole : IdentityRole<Guid>
{
    // Additional role metadata (optional)
    public ApplicationRole() : base() { }

    public ApplicationRole(string roleName) : base()
    {
        Name = roleName;
        NormalizedName = roleName.ToUpperInvariant();
    }
}

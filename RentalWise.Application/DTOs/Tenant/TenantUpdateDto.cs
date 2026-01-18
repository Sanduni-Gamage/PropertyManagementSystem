using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.DTOs.Tenant;

public class UpdateTenantDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? Gender { get; set; }
    public string PhoneNumber { get; set; } = null!;
    public string? Address { get; set; } = null!;
}
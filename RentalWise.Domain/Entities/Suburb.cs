using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class Suburb
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;

    public int DistrictId { get; set; }
    public District District { get; set; } = null!;
}


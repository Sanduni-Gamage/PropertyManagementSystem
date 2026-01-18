using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.DTOs.Property;

public class DistrictDto
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public RegionDto Region { get; set; } = null!;
}

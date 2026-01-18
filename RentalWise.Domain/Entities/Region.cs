using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class Region
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<District> Districts { get; set; } = new List<District>();
}

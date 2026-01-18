using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class District
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;

    public int RegionId { get; set; }
    public Region Region { get; set; } = null!;

    public ICollection<Suburb> Suburbs { get; set; } = new List<Suburb>();
}
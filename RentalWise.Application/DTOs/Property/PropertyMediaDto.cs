using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.DTOs.Property;

public class PropertyMediaDto
{
    public int Id { get; set; }
    public string Url { get; set; } = string.Empty;
    public string MediaType { get; set; } = "image"; // or "video"
}


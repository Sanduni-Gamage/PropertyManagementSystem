using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Enum;

[Flags]
public enum PropertyFeatures
{
    None = 0,
    Garage = 1,
    EnsuiteBathroom = 2,
    Study = 4,
    SeparateToilet = 8
}

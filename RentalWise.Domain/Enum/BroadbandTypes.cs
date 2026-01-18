using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Enum;

[Flags]
public enum BroadbandTypes
{
    None = 0,
    Fibre = 1,
    ADSL = 2,
    VDSL = 4,
    Wireless = 8
}

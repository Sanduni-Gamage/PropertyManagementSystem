using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Enum;

public enum Region
{
    Northland,
    Auckland,
    Waikato,

    [Display(Name = "Bay Of Plenty")]
    BayOfPlenty,

    Gisborne,

    [Display(Name = "Hawke's Bay")]
    HawkesBay,

    Taranaki,

    [Display(Name = "    Manawatu / Whanganui")]
    Manawatu,

    Wellington,
    Nelson,
    Marlborough,

    [Display(Name = "West Coast")]
    WestCoast,

    Canterbury,
    Otago,
    Southland
    
}

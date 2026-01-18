using RentalWise.Domain.Common;
using RentalWise.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Interfaces;

public interface IPropertyRepository
{
    Task<PaginatedResult<Property>> SearchPropertiesAsync(PropertySearchFilter filter);
}

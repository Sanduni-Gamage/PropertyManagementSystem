using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;
using RentalWise.Domain.Common;
using RentalWise.Domain.Entities;
using RentalWise.Domain.Enum;
using RentalWise.Domain.Interfaces;
using RentalWise.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Infrastructure.Repositories;

public class PropertyRepository : IPropertyRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public PropertyRepository(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<PaginatedResult<Property>> SearchPropertiesAsync(PropertySearchFilter filter)
    {
        var query = _context.Properties
            .Include(p => p.Suburb)
            .Include(p => p.Media)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Keyword))
        {
            query = query.Where(p =>
                p.Name.Contains(filter.Keyword) ||
                p.Address.Contains(filter.Keyword) ||
                p.Suburb.Name.Contains(filter.Keyword));
        }

        if (filter.RegionId.HasValue)
        {
            query = query.Where(p => p.Suburb.District.RegionId == filter.RegionId.Value);
        }

        if (filter.DistrictId.HasValue)
        {
            query = query.Where(p => p.Suburb.DistrictId == filter.DistrictId.Value);
        }

        if (filter.SuburbIds != null && filter.SuburbIds.Any())
        {
            query = query.Where(p => filter.SuburbIds.Contains(p.SuburbId));
        }

        if (filter.Bedrooms.HasValue)
            query = query.Where(p => p.Bedrooms >= filter.Bedrooms.Value);

        if (filter.Bathrooms.HasValue)
            query = query.Where(p => p.Bathrooms >= filter.Bathrooms.Value);

        if (filter.ParkingSpaces.HasValue)
            query = query.Where(p => p.ParkingSpaces >= filter.ParkingSpaces.Value);

        if (filter.MinRent.HasValue)
            query = query.Where(p => p.RentAmount >= filter.MinRent.Value);

        if (filter.MaxRent.HasValue)
            query = query.Where(p => p.RentAmount <= filter.MaxRent.Value);

        if (filter.PetsAllowed.HasValue)
            query = query.Where(p => p.PetsAllowed == filter.PetsAllowed.Value);

        if (filter.PropertyTypes != null && filter.PropertyTypes.Any())
        {
            query = query.Where(p => filter.PropertyTypes.Contains((int)p.PropertyType));
        }

        if (filter.PropertyFeatures.HasValue)
        {
            var selectedFeatures = (PropertyFeatures)filter.PropertyFeatures.Value;
            query = query.Where(p => (p.Features & selectedFeatures) == selectedFeatures);
        }

        if (filter.MoveInDate.HasValue)
            query = query.Where(p => p.AvailableDate <= filter.MoveInDate.Value); //  Move-in filtering

        var totalCount = await query.CountAsync();



        // Apply sorting
        query = filter.SortBy?.ToLower() switch
        {
            "price-asc" => query.OrderBy(p => p.RentAmount),
            "price-desc" => query.OrderByDescending(p => p.RentAmount),
            "latest" => query.OrderByDescending(p => p.CreatedAt), // or AvailableDate
            _ => query.OrderByDescending(p => p.CreatedAt) // default sort
        };

        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return new PaginatedResult<Property>
        {
            Items = items,
            TotalCount = totalCount,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize
        };
    }
}


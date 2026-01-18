using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalWise.Application.DTOs.Property;
using RentalWise.Infrastructure.Persistence;

namespace RentalWise.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public LocationsController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    // GET: /api/locations/regions
    [HttpGet("regions")]
    public async Task<ActionResult<IEnumerable<RegionDto>>> GetRegions()
    {
        var regions = await _context.Regions
            .Include(r => r.Districts)
            .ThenInclude(d => d.Suburbs)
            .ToListAsync();

        var result = _mapper.Map<List<RegionDto>>(regions);
        return Ok(result);
    }

    // GET: /api/locations/regions/{regionId}/districts
    [HttpGet("regions/{regionId}/districts")]
    public async Task<ActionResult<IEnumerable<DistrictDto>>> GetDistrictsByRegion(int regionId)
    {
        var districts = await _context.Districts
            .Where(d => d.RegionId == regionId)
            .Include(d => d.Suburbs)
            .ToListAsync();

        var result = _mapper.Map<List<DistrictDto>>(districts);
        return Ok(result);
    }

    // GET: /api/locations/districts/{districtId}/suburbs
    [HttpGet("districts/{districtId}/suburbs")]
    public async Task<ActionResult<IEnumerable<SuburbDto>>> GetSuburbsByDistrict(int districtId)
    {
        var suburbs = await _context.Suburbs
            .Where(s => s.DistrictId == districtId)
            .ToListAsync();

        var result = _mapper.Map<List<SuburbDto>>(suburbs);
        return Ok(result);
    }

    // GET: /api/locations/suburbs/search?name=Grafton
    [HttpGet("suburbs/search")]
    public async Task<ActionResult<SuburbDto>> GetSuburbByName([FromQuery] string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest("Name is required.");

        var suburb = await _context.Suburbs
            .Include(s => s.District)
            .ThenInclude(d => d.Region)
            .FirstOrDefaultAsync(s => s.Name.ToLower() == name.ToLower());

        if (suburb == null)
            return NotFound();

        var result = _mapper.Map<SuburbDto>(suburb);
        return Ok(result);
    }
}
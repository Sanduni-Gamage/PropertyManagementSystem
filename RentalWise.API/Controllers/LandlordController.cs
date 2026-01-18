using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalWise.Application.DTOs.Landlord;
using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;
using System.Security.Claims;

namespace RentalWise.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Landlord")]
public class LandlordController: ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public LandlordController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }



    [HttpPost]
    public async Task<IActionResult> AddLandlordProfile([FromBody] CreateLandlordDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var existingProfile = await _context.LandLords.FirstOrDefaultAsync(l => l.UserId == userId);
        if (existingProfile != null)
            return Conflict("Profile already exists for this user.");

        var profile = _mapper.Map<Landlord>(dto);
        profile.UserId = userId;

        _context.LandLords.Add(profile);
        await _context.SaveChangesAsync();

        var resultDto = _mapper.Map<LandlordDto>(profile);
        return CreatedAtAction(nameof(GetMyProfile), new { id = profile.Id }, resultDto);
    }


    [HttpGet]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var profile = await _context.LandLords
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
            return NotFound("No profile found.");

        var responseDto = _mapper.Map<LandlordDto>(profile);
        return Ok(responseDto);
    }


    // Update landlord profile
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateLandlordDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var profile = await _context.LandLords.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
            return NotFound("Profile not found.");

        // Map only updated fields from DTO to entity
        _mapper.Map(dto, profile);

        _context.LandLords.Update(profile);
        await _context.SaveChangesAsync();

        var updatedDto = _mapper.Map<LandlordDto>(profile);
        return Ok(updatedDto);
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteProfile()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var landlord = await _context.LandLords
        .Include(l => l.Properties)
            .ThenInclude(p => p.Leases)
        .FirstOrDefaultAsync(l => l.UserId == userId);

        var profile = await _context.LandLords.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
            return NotFound("Landlord profile not found.");

        var hasLeases = landlord.Properties.Any(p => p.Leases.Any());
        if (hasLeases)
            return BadRequest("Cannot delete profile. You have active leases associated with your properties.");

        _context.LandLords.Remove(landlord);

        await _context.SaveChangesAsync();

        return NoContent(); // 204 - Successfully deleted
    }
}

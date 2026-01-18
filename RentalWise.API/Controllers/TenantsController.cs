using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalWise.Application.DTOs.Landlord;
using RentalWise.Application.DTOs.Tenant;
using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;
using System.Security.Claims;

namespace RentalWise.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Tenant")]
public class TenantsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public TenantsController(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> AddTenantProfile([FromBody] CreateTenantDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var existingProfile = await _context.Tenants.FirstOrDefaultAsync(l => l.UserId == userId);
        if (existingProfile != null)
            return Conflict("Profile already exists for this user.");

        var profile = _mapper.Map<Tenant>(dto);
        profile.UserId = userId;

        _context.Tenants.Add(profile);
        await _context.SaveChangesAsync();

        var resultDto = _mapper.Map<TenantDto>(profile);
        return CreatedAtAction(nameof(GetMyProfile), new { id = profile.Id }, resultDto);
    }


    [HttpGet]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var profile = await _context.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
            return NotFound("No profile found.");

        var responseDto = _mapper.Map<TenantDto>(profile);
        return Ok(responseDto);
    }


    // Update tenant profile
    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateTenantDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var profile = await _context.Tenants.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
            return NotFound("Profile not found.");

        // Map only updated fields from DTO to entity
        _mapper.Map(dto, profile);

        _context.Tenants.Update(profile);
        await _context.SaveChangesAsync();

        var updatedDto = _mapper.Map<TenantDto>(profile);
        return Ok(updatedDto);
    }



    [HttpDelete]
    public async Task<IActionResult> DeleteProfile()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var tenant = await _context.Tenants
        .Include(t => t.Leases)
        .FirstOrDefaultAsync(t => t.UserId == userId);

        var profile = await _context.Tenants.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
            return NotFound("Tenant profile not found.");

        if (tenant.Leases.Any())
            return BadRequest("Cannot delete profile. You are associated with one or more leases.");

        // Soft delete
        tenant.IsActive = false;
        await _context.SaveChangesAsync();

        return NoContent(); // 204 - Successfully deleted
    }
}

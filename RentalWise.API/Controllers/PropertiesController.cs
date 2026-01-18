using AutoMapper;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentalWise.Application.DTOs.Property;
using RentalWise.Application.DTOs.Search;
using RentalWise.Application.Mappings;
using RentalWise.Application.Services;
using RentalWise.Domain.Entities;
using RentalWise.Domain.Interfaces;
using RentalWise.Infrastructure.Persistence;
using System.Security.Claims;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;
namespace RentalWise.API.Controllers;

[ApiController]
[Route("api/[controller]")]

public class PropertiesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IMediaUploadService _mediaUploadService;
    private readonly IPropertyRepository _propertyRepository;
    

    public PropertiesController(AppDbContext context, IMapper mapper, IMediaUploadService mediaUploadService, IPropertyRepository propertyRepository)
    {
        _context = context;
        _mapper = mapper;
        _mediaUploadService = mediaUploadService;
        _propertyRepository = propertyRepository;
        
    }


    [HttpGet]

    public async Task<ActionResult<IEnumerable<PropertyDto>>> GetAll(int pageNumber = 1, int pageSize = 10) //pagination 10 per page
    {
        var query = _context.Properties
       .Include(p => p.Suburb)
       .ThenInclude(s => s.District)
                    .ThenInclude(d => d.Region)
       .Include(p => p.Media)
       .OrderByDescending(p => p.CreatedAt);
          
        var totalCount = await query.CountAsync();
        var properties = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = _mapper.Map<List<PropertyDto>>(properties);

        // Optional: include pagination metadata
        return Ok(new
        {
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            Items = result
        });
       
    }

    [HttpGet("my")]
    [Authorize(Roles = "Landlord")]
    public async Task<ActionResult<IEnumerable<PropertyDto>>> GetMyProperties(int pageNumber = 1, int pageSize = 10)
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var query = _context.Properties
            .Include(p => p.Suburb)
                .ThenInclude(s => s.District)
                    .ThenInclude(d => d.Region)
            .Include(p => p.Media)
            .Where(p => p.UserId == userId) //  Guid FK
            .OrderByDescending(p => p.CreatedAt); // Optional ordering

        var totalCount = await query.CountAsync();
        var properties = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var result = _mapper.Map<List<PropertyDto>>(properties);

        // Optional: include pagination metadata
        return Ok(new
        {
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            Items = result
        });
    }

    // GET: api/properties/5
    [HttpGet("{id}")]
    [Authorize(Roles = "Landlord")]
    public async Task<ActionResult<PropertyDto>> GetById(int id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var property = await _context.Properties
            .Include(p => p.Media)
            .Include(p => p.Suburb)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (property == null)
            return NotFound("Property not found or not owned by this user.");

        var result = _mapper.Map<PropertyDto>(property);
        return Ok(result);
    }

    // GET: api/properties/public/5
    [HttpGet("public/{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<PropertyDto>> GetPublicById(int id)
    {
        var property = await _context.Properties
            .Include(p => p.Suburb)
                .ThenInclude(s => s.District)
                    .ThenInclude(d => d.Region)
            .Include(p => p.Media)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (property == null)
            return NotFound("Property not found.");

        var result = _mapper.Map<PropertyDto>(property);
        return Ok(result);
    }


    // POST: api/properties
    [HttpPost]
    [Authorize(Roles = "Landlord")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreatePropertyDto model)
    {
        if (model == null)
        {
            return BadRequest("Property data is required.");
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        // Find landlord associated with this user
        var landlord = await _context.LandLords.FirstOrDefaultAsync(l => l.UserId == userId);
        if (landlord == null)
            return BadRequest("Landlord profile not found for this user.");

        // Map from DTO to Entity
        var property = _mapper.Map<Property>(model);

        property.UserId = userId; // assign manually
        property.LandlordId = landlord.Id;

        if (model.RentAmount < 0)
        {
            ModelState.AddModelError("RentAmount", "Rent amount cannot be negative.");
            return BadRequest(ModelState);
        }

        if (model.Images != null && model.Images.Count > 20)
        {
            ModelState.AddModelError("Images", "You can upload up to 20 images.");
            return BadRequest(ModelState);
        }

        // Upload media using new method signature (existingImageCount = 0 for new property)
        var mediaList = await _mediaUploadService.UploadPropertyMediaAsync(
        model.Images ?? new List<IFormFile>(),
        model.Video,
        existingImageCount: 0,
        videoAlreadyExists: false);

        // Attach media to property
        property.Media = mediaList;

        _context.Properties.Add(property);
        await _context.SaveChangesAsync();

        // Map from Entity to DTO
        var result = _mapper.Map<PropertyDto>(property);
        return CreatedAtAction(nameof(GetMyProperties), new { id = property.Id }, result);
    }

    // PUT: api/properties/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Landlord")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdatePropertyDto model)
    {
        try
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdString, out var userId))
                return Unauthorized("Invalid user ID.");

            if (model == null)
                return BadRequest("Model is null. Check if form-data keys match UpdatePropertyDto.");

            var property = await _context.Properties
                .Include(p => p.Media)
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (property == null)
                return NotFound("Property not found or not owned by user.");

            _mapper.Map(model, property);

            if (model.RentAmount < 0)
            {
                ModelState.AddModelError("RentAmount", "Rent amount cannot be negative.");
                return BadRequest(ModelState);
            }

            // Initialize Media if null (defensive)
            property.Media ??= new List<PropertyMedia>();

            //1. Handle removed media
            if (model.RemovedMediaIds != null && model.RemovedMediaIds.Any())
            {
                var mediaToRemove = property.Media
                    .Where(m => model.RemovedMediaIds.Contains(m.Id))
                    .ToList();

                if (mediaToRemove.Any())
                {
                    await _mediaUploadService.DeleteMediaOneByOneAsync(mediaToRemove);
                    _context.PropertyMedia.RemoveRange(mediaToRemove);

                    foreach (var media in mediaToRemove)
                        property.Media.Remove(media);
                }
            }

            // 2. Upload new media
            int existingImageCount = property.Media.Count(m => m.MediaType == "image");
            bool videoAlreadyExists = property.Media.Any(m => m.MediaType == "video");

            var newMedia = await _mediaUploadService.UploadPropertyMediaAsync(
                model.Images ?? new List<IFormFile>(),
                model.Video,
                existingImageCount,
                videoAlreadyExists
            );

            foreach (var media in newMedia)
            {
                media.PropertyId = property.Id;
                property.Media.Add(media);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ UPDATE PROPERTY ERROR: " + ex.Message);
            return StatusCode(500, $"Server Error: {ex.Message}");
        }
    }


    //Delete Individual Media
    [HttpDelete("media/{mediaId}")]
    [Authorize(Roles = "Landlord")]
    public async Task<IActionResult> DeleteMedia(int mediaId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized();

        var media = await _context.PropertyMedia
            .Include(m => m.Property)
            .FirstOrDefaultAsync(m => m.Id == mediaId && m.Property.UserId == userGuid);

        if (media == null)
            return NotFound("Media not found or not owned by user.");

        await _mediaUploadService.DeleteMediaOneByOneAsync(new[] { media });
        _context.PropertyMedia.Remove(media);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/properties/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Landlord")]
    public async Task<IActionResult> Delete(int id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized("Invalid user ID.");

        var property = await _context.Properties
            .Include(p => p.Media)
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

        if (property == null)
            return NotFound("Property not found or not owned by user.");

        var today = DateTime.UtcNow.Date;
        if (property.Leases.Any(l => l.EndDate >= today))
            return BadRequest("Cannot delete property. It has active leases.");

        try
        {
            // Delete associated media from Cloudinary
            if (property.Media != null && property.Media.Any())
            {
                await _mediaUploadService.DeleteMediaOneByOneAsync(property.Media);
            }

            /* if (isAdmin)
             {
            // Delete media from Cloudinary
             foreach (var media in property.Media)
             {
                 DeletionParams deletionParams = new DeletionParams(media.PublicId);
                 await _mediaUploadService.DeleteMediaAsync(deletionParams);
             }
                 // Perform a hard delete
                 _context.Properties.Remove(property);
             }*/



            _context.Properties.Remove(property);

            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            Console.WriteLine("❌ DELETE PROPERTY ERROR: " + ex.Message);
            return StatusCode(500, "Server error during deletion.");
        }
    }

    [HttpPost("search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchProperties([FromBody] PropertySearchFilter filter)
    {
        var result = await _propertyRepository.SearchPropertiesAsync(filter);
        return Ok(result);
    }


}
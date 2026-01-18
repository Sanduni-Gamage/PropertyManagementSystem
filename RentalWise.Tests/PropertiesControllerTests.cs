/*using AutoMapper;
using Xunit;
using Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using RentalWise.API.Controllers;
using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using RentalWise.Application.DTOs.Property;

namespace RentalWise.Tests;

public class PropertiesControllerTests
{
    private readonly IMapper _mapper;

    public PropertiesControllerTests()
    {
        // AutoMapper configuration to simulate real mappings
        var config = new MapperConfiguration(cfg =>
        {
            cfg.CreateMap<Domain.Entities.Property, PropertyDto>();
            cfg.CreateMap<CreatePropertyDto, Domain.Entities.Property>();
            cfg.CreateMap<UpdatePropertyDto, Domain.Entities.Property>();
        });

        _mapper = config.CreateMapper(); // Create mapper instance

    }

    // Helper method to create a controller with mock context and user
    private PropertiesController GetController(string userId, List<Domain.Entities.Property>? seedData = null)
    {
        // Create in-memory database for test isolation
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()) // Use a unique DB per test
            .Options;

        var context = new AppDbContext(options); // Create fake DbContext

        // Add test data to database if provided
        if (seedData != null)
        {
            context.Properties.AddRange(seedData);
            context.SaveChanges();
        }
        // Create the controller with the fake context and mapper
        var controller = new PropertiesController(context, _mapper)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    // Set up mock user with specified userId
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId) // Mocking User.Identity.Name
                    }, "mock"))
                }
            }
        };

        return controller;
    }

    // Positive test: Get a property if user is the owner
    [Fact]
    public async Task GetById_ReturnsProperty_IfOwnedByUser()
    {
        var userId = "user123";
        var property = new Domain.Entities.Property { Id = 1, Name = "My House", Address = "1 Lane", RentAmount = 1000, UserId = userId };
        var controller = GetController(userId, new List<Domain.Entities.Property> { property });

        var result = await controller.GetById(1); // Call controller

        var ok = Assert.IsType<OkObjectResult>(result.Result); // Expect HTTP 200 OK
        var dto = Assert.IsType<PropertyDto>(ok.Value); // Expect the right DTO
        Assert.Equal("My House", dto.Name); // Confirm data is correct
    }


    // Negative test: User tries to get property they don't own
    [Fact]
    public async Task GetById_ReturnsForbidden_IfNotOwner()
    {
        var controller = GetController("intruder", new List<Domain.Entities.Property>
        {
            new Domain.Entities.Property { Id = 2, Name = "Private", Address = "Secret", RentAmount = 500, UserId = "owner123" }
        });

        var result = await controller.GetById(2);
        Assert.IsType<ForbidResult>(result.Result); // Should return 403 Forbidden
    }

    // Create a property with valid input
    [Fact]
    public async Task Create_ReturnsCreated_WhenValid()
    {
        var controller = GetController("creator");

        var model = new CreatePropertyDto
        {
            Name = "New Flat",
            Address = "Flat St",
            RentAmount = 950
        };

        var result = await controller.Create(model); // Call Create()

        var created = Assert.IsType<CreatedAtActionResult>(result); // Should return 201 Created
        var dto = Assert.IsType<PropertyDto>(created.Value);
        Assert.Equal("New Flat", dto.Name);
    }

    // Create with invalid model state (simulates validation failure)
    [Fact]
    public async Task Create_ReturnsBadRequest_WhenModelInvalid()
    {
        var controller = GetController("creator");
        controller.ModelState.AddModelError("Name", "Required"); // Simulate validation error

        var result = await controller.Create(new CreatePropertyDto()); // Empty model

        Assert.IsType<BadRequestObjectResult>(result); // Should return 400 Bad Request
    }

    // Null DTO passed to Create() method
    [Fact]
    public async Task Create_ReturnsBadRequest_WhenDtoIsNull()
    {
        var controller = GetController("creator");

        var result = await controller.Create(null); // null payload

        Assert.IsType<BadRequestObjectResult>(result); // Should return 400 Bad Request
    }

    // Successfully update a property
    [Fact]
    public async Task Update_ReturnsNoContent_WhenSuccessful()
    {
        var userId = "editor";
        var prop = new Domain.Entities.Property { Id = 3, Name = "Old", Address = "Old St", RentAmount = 800, UserId = userId };
        var controller = GetController(userId, new List<Domain.Entities.Property> { prop });

        var model = new UpdatePropertyDto
        {
            Name = "Updated",
            Address = "New St",
            RentAmount = 900
        };

        var result = await controller.Update(3, model);
        Assert.IsType<NoContentResult>(result); // Expect 204 No Content
    }

    // Update with null DTO
    [Fact]
    public async Task Update_ReturnsBadRequest_WhenDtoIsNull()
    {
        var controller = GetController("editor");

        var result = await controller.Update(3, null);

        Assert.IsType<BadRequestResult>(result); // Expect 400
    }

    // Update attempt by unauthorized user
    [Fact]
    public async Task Update_ReturnsForbidden_WhenNotOwner()
    {
        var controller = GetController("badGuy", new List<Domain.Entities.Property>
        {
            new Domain.Entities.Property { Id = 4, Name = "Secret", Address = "Somewhere", RentAmount = 1200, UserId = "trueOwner" }
        });

        var result = await controller.Update(4, new UpdatePropertyDto { Name = "Hacked", Address = "???", RentAmount = 1 });

        Assert.IsType<ForbidResult>(result); // Expect 403 Forbidden
    }

    // Delete by the rightful owner
    [Fact]
    public async Task Delete_ReturnsNoContent_WhenAuthorized()
    {
        var userId = "deleter";
        var prop = new Domain.Entities.Property { Id = 5, Name = "Remove", Address = "To Be Removed", RentAmount = 200, UserId = userId };
        var controller = GetController(userId, new List<Domain.Entities.Property> { prop });

        var result = await controller.Delete(5);

        Assert.IsType<NoContentResult>(result); // Expect 204
    }

    // Unauthorized delete attempt
    [Fact]
    public async Task Delete_ReturnsForbidden_WhenNotOwner()
    {
        var controller = GetController("badUser", new List<Domain.Entities.Property>
        {
            new Domain.Entities.Property { Id = 6, Name = "Stolen", Address = "Unknown", RentAmount = 1, UserId = "owner123" }
        });

        var result = await controller.Delete(6);
        Assert.IsType<ForbidResult>(result); // Should return 403
    }

    // Business rule test: rent must not be negative
    [Fact]
    public async Task Create_ReturnsBadRequest_WhenNegativeRent()
    {
        var controller = GetController("creator");

        var model = new CreatePropertyDto
        {
            Name = "Invalid Rent",
            Address = "Somewhere",
            RentAmount = -500 // Invalid value
        };

        controller.ModelState.AddModelError("RentAmount", "Cannot be negative"); // Simulate server-side validation

        var result = await controller.Create(model);

        Assert.IsType<BadRequestObjectResult>(result); // Expect 400 Bad Request
    }
}
*/
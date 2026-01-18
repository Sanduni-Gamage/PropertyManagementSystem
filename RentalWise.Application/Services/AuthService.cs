using BCrypt.Net;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using RentalWise.Application.DTOs;
using RentalWise.Domain.Entities;
using RentalWise.Infrastructure.Persistence;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;


namespace RentalWise.Application.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IConfiguration _config;
    private readonly AppDbContext _context;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration config,
        AppDbContext context)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _config = config;
        _context = context;
       
    }

    public async Task<string> RegisterAsync(RegisterDto dto, string role)
    {
        var allowedRoles = new[] { "Tenant", "Landlord" };

        if (!allowedRoles.Contains(role))
            throw new ArgumentException("Invalid role selected");

        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
            throw new InvalidOperationException("User already exists");

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            throw new ApplicationException(string.Join(", ", result.Errors.Select(e => e.Description)));

        if (!await _roleManager.RoleExistsAsync(role))
            await _roleManager.CreateAsync(new ApplicationRole(role));

        await _userManager.AddToRoleAsync(user, role);

        // Create corresponding profile entity
        if (role == "Tenant")
        {
            var tenant = new Tenant
            {
                UserId = user.Id
            };
            _context.Tenants.Add(tenant);
        }
        else if (role == "Landlord")
        {
            var landlord = new Landlord
            {
                UserId = user.Id
            };
            _context.LandLords.Add(landlord);
        }

        await _context.SaveChangesAsync();

        return await GenerateTokenAsync(user);
    }

    public async Task<string> LoginAsync(LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            throw new Exception("Invalid credentials");

        // Check if user is a landlord
        var landlord = await _context.LandLords
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(l => l.UserId == user.Id);

        if (landlord != null && !landlord.IsActive)
            throw new Exception("Your landlord account has been deactivated.");

        // Check if user is a tenant
        var tenant = await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.UserId == user.Id);

        if (tenant != null && !tenant.IsActive)
            throw new Exception("Your tenant account has been deactivated.");

        // If user has a profile, they must be active
        if (landlord == null && tenant == null)
            throw new Exception("No valid user role assigned. Contact support.");

        return await GenerateTokenAsync(user);
    }

    private async Task<string> GenerateTokenAsync(ApplicationUser user)
    {
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);
        var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        //Add the first role as a flat claim for easier access on the frontend
        if (roles.Any())
        {
            claims.Add(new Claim("role", roles.First())); // Custom claim 
        }

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(4),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}


using CloudinaryDotNet;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RentalWise.API.Configurations;
using RentalWise.API.Hubs;
using RentalWise.Application.Mappings;
using RentalWise.Application.Services;
using RentalWise.Application.Services.Applications;
using RentalWise.Application.Services.Maintenance;
using RentalWise.Application.Validators;
using RentalWise.Domain.Ai;
using RentalWise.Domain.Entities;
using RentalWise.Domain.Interfaces;
using RentalWise.Infrastructure.Ai.Gemini;
using RentalWise.Infrastructure.Persistence;
using RentalWise.Infrastructure.Repositories;
using RentalWise.Infrastructure.SeedData;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Allow CORS
//
// The dev server's port is not stable: Vite falls back to 5174, 5175 and so on whenever
// 5173 is already in use, and a single hardcoded origin then fails every request with a
// CORS error that reads as though the API is down. So in Development any loopback origin
// is accepted, whatever port it is on; everywhere else only the configured origins are.
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();

        if (builder.Environment.IsDevelopment())
        {
            // SetIsOriginAllowed rather than AllowAnyOrigin, because the latter cannot be
            // combined with AllowCredentials.
            policy.SetIsOriginAllowed(origin =>
                Uri.TryCreate(origin, UriKind.Absolute, out var uri)
                && (uri.IsLoopback
                    || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)));
        }
        else
        {
            policy.WithOrigins(allowedOrigins);
        }
    });
});

builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();
var jwtKey = builder.Configuration["Jwt:Key"] ?? "YourSuperSecretKeyHere";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "RentalWiseAPI";

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RentalWise API",
        Version = "v1"
    });

    // Add JWT Authentication
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token in the format: Bearer {your token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Id = "Bearer",
                    Type = ReferenceType.SecurityScheme
                }
            },
            new List<string>()
        }
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});
builder.Services.AddSignalR();
builder.Services.AddAuthorization();

builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreatePropertyDtoValidator>();
builder.Services.AddAutoMapper(typeof(MappingProfile));

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = 104857600; // 100 MB
});

builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("Cloudinary"));

builder.Services.AddSingleton(s =>
{
    var config = builder.Configuration.GetSection("Cloudinary").Get<CloudinarySettings>();
    var account = new Account(config.CloudName,
                              config.ApiKey,
                              config.ApiSecret);
    return new CloudinaryDotNet.Cloudinary(account);
});
builder.Services.AddScoped<IMediaUploadService, MediaUploadService>();
builder.Services.AddScoped<IPropertyRepository, PropertyRepository>();

// --- AI maintenance agent ---

builder.Services.Configure<GeminiOptions>(builder.Configuration.GetSection(GeminiOptions.SectionName));
builder.Services.Configure<MaintenanceAgentOptions>(builder.Configuration.GetSection(MaintenanceAgentOptions.SectionName));

// Allow GEMINI_API_KEY as an alternative to Gemini:ApiKey, since a bare environment
// variable is the easier thing to set on a host and in CI.
var geminiKeyFromEnvironment = builder.Configuration["GEMINI_API_KEY"];
if (!string.IsNullOrWhiteSpace(geminiKeyFromEnvironment))
    builder.Services.PostConfigure<GeminiOptions>(options => options.ApiKey = geminiKeyFromEnvironment);

builder.Services.AddHttpClient<IChatModel, GeminiChatModel>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<GeminiOptions>>().Value;

    var baseUrl = options.BaseUrl.EndsWith('/') ? options.BaseUrl : options.BaseUrl + "/";
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);
});

builder.Services.AddScoped<IMaintenanceToolbox, MaintenanceToolbox>();
builder.Services.AddScoped<IMaintenanceAgent, MaintenanceAgent>();
builder.Services.AddScoped<IMaintenanceService, MaintenanceService>();

// Tenancy applications. Approving one creates the lease that maintenance reporting
// depends on, so this is the route into the maintenance flow.
builder.Services.AddScoped<IRentalApplicationService, RentalApplicationService>();


var app = builder.Build();

app.UseCors("AllowFrontend");

// Seed roles on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    await IdentitySeeder.SeedRolesAsync(services);

    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await LocationSeeder.SeedLocations(context);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication(); //  for JWT
app.UseAuthorization();  //  This too
app.MapControllers();          //  required to map `[ApiController]`



app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

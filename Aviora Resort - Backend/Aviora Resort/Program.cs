using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using AvioraResort.Data;
using AvioraResort.Repositories;
using AvioraResort.Security;
using AvioraResort.Services;

var builder = WebApplication.CreateBuilder(args);

/* ---------- Data access ---------- */
var connectionString = builder.Configuration.GetConnectionString("AvioraDB")
    ?? throw new InvalidOperationException("ConnectionStrings:AvioraDB is missing.");

builder.Services.AddSingleton(new SqlHelper(connectionString));

/* ---------- Dependency injection ---------- */
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IVillaRepository, VillaRepository>();   // NEW
builder.Services.AddScoped<IVillaService, VillaService>();  // NEW

builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IVillaRepository, VillaRepository>();    // villas module
builder.Services.AddScoped<IVillaService, VillaService>();       // villas module

builder.Services.AddScoped<IReviewRepository, ReviewRepository>();   // NEW
builder.Services.AddScoped<IReviewService, ReviewService>();      // NEW

builder.Services.AddScoped<IPricingRepository, PricingRepository>();   // NEW
builder.Services.AddScoped<IPricingService, PricingService>();      // NEW

builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();   // NEW
builder.Services.AddScoped<IInventoryService, InventoryService>();      // NEW

builder.Services.AddScoped<IBookingRepository, BookingRepository>();   // NEW
builder.Services.AddScoped<IBookingService, BookingService>();      // NEW

/* ---------- JWT authentication ---------- */
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is missing.");

if (jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be at least 32 characters.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            // Stated explicitly so [Authorize(Roles = "admin")] keeps working
            // even if inbound claim mapping is changed later.
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name,

            // No grace period on expiry. Default is five minutes, which would
            // keep an expired admin token alive longer than intended.
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

/* ---------- Rate limiting on the credential endpoints ----------
   Account lockout stops one account being guessed. This stops one IP address
   spraying a common password across many accounts, which lockout cannot see. */
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        await context.HttpContext.Response.WriteAsJsonAsync(
            new { message = "Too many attempts. Please wait a minute and try again." },
            cancellationToken: token);
    };
});

/* ---------- CORS for the React dev server ---------- */
const string CorsPolicy = "AvioraFrontend";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

/* ---------- Controllers and Swagger ---------- */
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Aviora Resort API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste only the token value. Swagger adds the Bearer prefix."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});



var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(CorsPolicy);
app.UseRateLimiter();      // before authentication so floods are dropped early
app.UseAuthentication();   // must come before UseAuthorization
app.UseAuthorization();
app.MapControllers();

app.Run();
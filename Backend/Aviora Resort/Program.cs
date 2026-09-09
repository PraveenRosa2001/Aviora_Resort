//using System.Security.Claims;
//using System.Text;
//using System.Threading.RateLimiting;
//using Microsoft.AspNetCore.Authentication.JwtBearer;
//using Microsoft.AspNetCore.RateLimiting;
//using Microsoft.IdentityModel.Tokens;
//using Microsoft.OpenApi.Models;
//using AvioraResort.Data;
//using AvioraResort.Repositories;
//using AvioraResort.Security;
//using AvioraResort.Services;

//var builder = WebApplication.CreateBuilder(args);

///* ---------- Data access ---------- */
//var connectionString = builder.Configuration.GetConnectionString("AvioraDB")
//    ?? throw new InvalidOperationException("ConnectionStrings:AvioraDB is missing.");

//builder.Services.AddSingleton(new SqlHelper(connectionString));

///* ---------- Dependency injection ---------- */
//builder.Services.AddScoped<IUserRepository, UserRepository>();
//builder.Services.AddScoped<IAuthService, AuthService>();

//builder.Services.AddScoped<IVillaRepository, VillaRepository>();   // NEW
//builder.Services.AddScoped<IVillaService, VillaService>();  // NEW

//builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
//builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

//builder.Services.AddScoped<IUserRepository, UserRepository>();
//builder.Services.AddScoped<IAuthService, AuthService>();

//builder.Services.AddScoped<IVillaRepository, VillaRepository>();    // villas module
//builder.Services.AddScoped<IVillaService, VillaService>();       // villas module

//builder.Services.AddScoped<IReviewRepository, ReviewRepository>();   // NEW
//builder.Services.AddScoped<IReviewService, ReviewService>();      // NEW

//builder.Services.AddScoped<IPricingRepository, PricingRepository>();   // NEW
//builder.Services.AddScoped<IPricingService, PricingService>();      // NEW

//builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();   // NEW
//builder.Services.AddScoped<IInventoryService, InventoryService>();      // NEW

//builder.Services.AddScoped<IBookingRepository, BookingRepository>();   // NEW
//builder.Services.AddScoped<IBookingService, BookingService>();      // NEW

//builder.Services.AddScoped<IDiningRepository, DiningRepository>();   // NEW
//builder.Services.AddScoped<IDiningService, DiningService>();      // NEW

//builder.Services.AddScoped<IGalleryRepository, GalleryRepository>();   // NEW
//builder.Services.AddScoped<IGalleryService, GalleryService>();      // NEW

///* ---------- JWT authentication ---------- */
//var jwtKey = builder.Configuration["Jwt:Key"]
//    ?? throw new InvalidOperationException("Jwt:Key is missing.");

//if (jwtKey.Length < 32)
//    throw new InvalidOperationException("Jwt:Key must be at least 32 characters.");

//builder.Services
//    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
//    .AddJwtBearer(options =>
//    {
//        options.TokenValidationParameters = new TokenValidationParameters
//        {
//            ValidateIssuer = true,
//            ValidateAudience = true,
//            ValidateLifetime = true,
//            ValidateIssuerSigningKey = true,
//            ValidIssuer = builder.Configuration["Jwt:Issuer"],
//            ValidAudience = builder.Configuration["Jwt:Audience"],
//            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

//            // Stated explicitly so [Authorize(Roles = "admin")] keeps working
//            // even if inbound claim mapping is changed later.
//            RoleClaimType = ClaimTypes.Role,
//            NameClaimType = ClaimTypes.Name,

//            // No grace period on expiry. Default is five minutes, which would
//            // keep an expired admin token alive longer than intended.
//            ClockSkew = TimeSpan.Zero
//        };
//    });

//builder.Services.AddAuthorization();

///* ---------- Rate limiting on the credential endpoints ----------
//   Account lockout stops one account being guessed. This stops one IP address
//   spraying a common password across many accounts, which lockout cannot see. */
//builder.Services.AddRateLimiter(options =>
//{
//    options.AddPolicy("auth", httpContext =>
//        RateLimitPartition.GetFixedWindowLimiter(
//            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
//            factory: _ => new FixedWindowRateLimiterOptions
//            {
//                PermitLimit = 10,
//                Window = TimeSpan.FromMinutes(1),
//                QueueLimit = 0
//            }));

//    options.OnRejected = async (context, token) =>
//    {
//        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
//        await context.HttpContext.Response.WriteAsJsonAsync(
//            new { message = "Too many attempts. Please wait a minute and try again." },
//            cancellationToken: token);
//    };
//});

///* ---------- CORS for the React dev server ---------- */
//const string CorsPolicy = "AvioraFrontend";
//builder.Services.AddCors(options =>
//{
//    options.AddPolicy(CorsPolicy, policy =>
//        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
//              .AllowAnyHeader()
//              .AllowAnyMethod());
//});

///* ---------- Controllers and Swagger ---------- */
//builder.Services.AddControllers();
//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen(c =>
//{
//    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Aviora Resort API", Version = "v1" });

//    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
//    {
//        Name = "Authorization",
//        Type = SecuritySchemeType.Http,
//        Scheme = "bearer",
//        BearerFormat = "JWT",
//        In = ParameterLocation.Header,
//        Description = "Paste only the token value. Swagger adds the Bearer prefix."
//    });
//    c.AddSecurityRequirement(new OpenApiSecurityRequirement
//    {
//        {
//            new OpenApiSecurityScheme
//            {
//                Reference = new OpenApiReference
//                {
//                    Type = ReferenceType.SecurityScheme,
//                    Id   = "Bearer"
//                }
//            },
//            Array.Empty<string>()
//        }
//    });
//});



//var app = builder.Build();

//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

//app.UseHttpsRedirection();
//app.UseCors(CorsPolicy);
//app.UseRateLimiter();      // before authentication so floods are dropped early
//app.UseAuthentication();   // must come before UseAuthorization
//app.UseAuthorization();
//app.MapControllers();
//app.UseStaticFiles();     // serves wwwroot, including uploads/gallery
//app.Run();


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
using AvioraResort.Middleware;
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

builder.Services.AddScoped<IDiningRepository, DiningRepository>();   // NEW
builder.Services.AddScoped<IDiningService, DiningService>();      // NEW

builder.Services.AddSingleton<IMediaService, MediaService>();   // NEW

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

builder.Services.AddScoped<IGalleryRepository, GalleryRepository>();
builder.Services.AddScoped<IGalleryService, GalleryService>();

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

/* The upload folder is created on demand by GalleryService, but making it
   here means the first upload does not depend on the app pool having
   directory-creation rights at that moment. */
Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath,
                                       "wwwroot", "uploads", "gallery"));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

/* ---------- Pipeline ----------

   Order matters more here than it looks.

   1. The exception handler goes FIRST so it wraps everything below it. Without
      it, an unhandled exception is written by the developer exception page,
      which calls Response.Clear() and discards the CORS headers that
      UseCors had already queued. The browser then refuses the response and
      reports "TypeError: Failed to fetch" with 0 B transferred - so the real
      500 is invisible and every server fault looks like a network fault.

   2. UseCors comes before UseHttpsRedirection. A preflight OPTIONS arriving
      on http would otherwise get a 307 with no CORS headers on it.

   3. UseStaticFiles serves wwwroot, which is where gallery uploads land.
      Without it the upload succeeds and the image 404s.
   -------------------------------------------------------------- */

app.UseMiddleware<ApiExceptionMiddleware>();

app.UseCors(CorsPolicy);
app.UseHttpsRedirection();

app.UseStaticFiles();      // wwwroot, including uploads/gallery

app.UseRateLimiter();      // before authentication so floods are dropped early
app.UseAuthentication();   // must come before UseAuthorization
app.UseAuthorization();
app.MapControllers();

app.Run();
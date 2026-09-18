////using System.Security.Claims;
////using System.Text;
////using System.Threading.RateLimiting;
////using Microsoft.AspNetCore.Authentication.JwtBearer;
////using Microsoft.AspNetCore.RateLimiting;
////using Microsoft.IdentityModel.Tokens;
////using Microsoft.OpenApi.Models;
////using AvioraResort.Data;
////using AvioraResort.Repositories;
////using AvioraResort.Security;
////using AvioraResort.Services;

////var builder = WebApplication.CreateBuilder(args);

/////* ---------- Data access ---------- */
////var connectionString = builder.Configuration.GetConnectionString("AvioraDB")
////    ?? throw new InvalidOperationException("ConnectionStrings:AvioraDB is missing.");

////builder.Services.AddSingleton(new SqlHelper(connectionString));

/////* ---------- Dependency injection ---------- */
////builder.Services.AddScoped<IUserRepository, UserRepository>();
////builder.Services.AddScoped<IAuthService, AuthService>();

////builder.Services.AddScoped<IVillaRepository, VillaRepository>();   // NEW
////builder.Services.AddScoped<IVillaService, VillaService>();  // NEW

////builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
////builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

////builder.Services.AddScoped<IUserRepository, UserRepository>();
////builder.Services.AddScoped<IAuthService, AuthService>();

////builder.Services.AddScoped<IVillaRepository, VillaRepository>();    // villas module
////builder.Services.AddScoped<IVillaService, VillaService>();       // villas module

////builder.Services.AddScoped<IReviewRepository, ReviewRepository>();   // NEW
////builder.Services.AddScoped<IReviewService, ReviewService>();      // NEW

////builder.Services.AddScoped<IPricingRepository, PricingRepository>();   // NEW
////builder.Services.AddScoped<IPricingService, PricingService>();      // NEW

////builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();   // NEW
////builder.Services.AddScoped<IInventoryService, InventoryService>();      // NEW

////builder.Services.AddScoped<IBookingRepository, BookingRepository>();   // NEW
////builder.Services.AddScoped<IBookingService, BookingService>();      // NEW

////builder.Services.AddScoped<IDiningRepository, DiningRepository>();   // NEW
////builder.Services.AddScoped<IDiningService, DiningService>();      // NEW

////builder.Services.AddScoped<IGalleryRepository, GalleryRepository>();   // NEW
////builder.Services.AddScoped<IGalleryService, GalleryService>();      // NEW

/////* ---------- JWT authentication ---------- */
////var jwtKey = builder.Configuration["Jwt:Key"]
////    ?? throw new InvalidOperationException("Jwt:Key is missing.");

////if (jwtKey.Length < 32)
////    throw new InvalidOperationException("Jwt:Key must be at least 32 characters.");

////builder.Services
////    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
////    .AddJwtBearer(options =>
////    {
////        options.TokenValidationParameters = new TokenValidationParameters
////        {
////            ValidateIssuer = true,
////            ValidateAudience = true,
////            ValidateLifetime = true,
////            ValidateIssuerSigningKey = true,
////            ValidIssuer = builder.Configuration["Jwt:Issuer"],
////            ValidAudience = builder.Configuration["Jwt:Audience"],
////            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

////            // Stated explicitly so [Authorize(Roles = "admin")] keeps working
////            // even if inbound claim mapping is changed later.
////            RoleClaimType = ClaimTypes.Role,
////            NameClaimType = ClaimTypes.Name,

////            // No grace period on expiry. Default is five minutes, which would
////            // keep an expired admin token alive longer than intended.
////            ClockSkew = TimeSpan.Zero
////        };
////    });

////builder.Services.AddAuthorization();

/////* ---------- Rate limiting on the credential endpoints ----------
////   Account lockout stops one account being guessed. This stops one IP address
////   spraying a common password across many accounts, which lockout cannot see. */
////builder.Services.AddRateLimiter(options =>
////{
////    options.AddPolicy("auth", httpContext =>
////        RateLimitPartition.GetFixedWindowLimiter(
////            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
////            factory: _ => new FixedWindowRateLimiterOptions
////            {
////                PermitLimit = 10,
////                Window = TimeSpan.FromMinutes(1),
////                QueueLimit = 0
////            }));

////    options.OnRejected = async (context, token) =>
////    {
////        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
////        await context.HttpContext.Response.WriteAsJsonAsync(
////            new { message = "Too many attempts. Please wait a minute and try again." },
////            cancellationToken: token);
////    };
////});

/////* ---------- CORS for the React dev server ---------- */
////const string CorsPolicy = "AvioraFrontend";
////builder.Services.AddCors(options =>
////{
////    options.AddPolicy(CorsPolicy, policy =>
////        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
////              .AllowAnyHeader()
////              .AllowAnyMethod());
////});

/////* ---------- Controllers and Swagger ---------- */
////builder.Services.AddControllers();
////builder.Services.AddEndpointsApiExplorer();
////builder.Services.AddSwaggerGen(c =>
////{
////    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Aviora Resort API", Version = "v1" });

////    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
////    {
////        Name = "Authorization",
////        Type = SecuritySchemeType.Http,
////        Scheme = "bearer",
////        BearerFormat = "JWT",
////        In = ParameterLocation.Header,
////        Description = "Paste only the token value. Swagger adds the Bearer prefix."
////    });
////    c.AddSecurityRequirement(new OpenApiSecurityRequirement
////    {
////        {
////            new OpenApiSecurityScheme
////            {
////                Reference = new OpenApiReference
////                {
////                    Type = ReferenceType.SecurityScheme,
////                    Id   = "Bearer"
////                }
////            },
////            Array.Empty<string>()
////        }
////    });
////});



////var app = builder.Build();

////if (app.Environment.IsDevelopment())
////{
////    app.UseSwagger();
////    app.UseSwaggerUI();
////}

////app.UseHttpsRedirection();
////app.UseCors(CorsPolicy);
////app.UseRateLimiter();      // before authentication so floods are dropped early
////app.UseAuthentication();   // must come before UseAuthorization
////app.UseAuthorization();
////app.MapControllers();
////app.UseStaticFiles();     // serves wwwroot, including uploads/gallery
////app.Run();


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
//using AvioraResort.Middleware;
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

//builder.Services.AddSingleton<IMediaService, MediaService>();   // NEW

//builder.Services.AddScoped<IInquiryRepository, InquiryRepository>();   // NEW
//builder.Services.AddScoped<IInquiryService, InquiryService>();      // NEW

//builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
//builder.Services.Configure<ResortSettings>(builder.Configuration.GetSection("Resort"));
//builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();

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
////builder.Services.AddRateLimiter(options =>
////{
////    options.AddPolicy("auth", httpContext =>
////        RateLimitPartition.GetFixedWindowLimiter(
////            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
////            factory: _ => new FixedWindowRateLimiterOptions
////            {
////                PermitLimit = 10,
////                Window = TimeSpan.FromMinutes(1),
////                QueueLimit = 0
////            }));

////    options.OnRejected = async (context, token) =>
////    {
////        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
////        await context.HttpContext.Response.WriteAsJsonAsync(
////            new { message = "Too many attempts. Please wait a minute and try again." },
////            cancellationToken: token);
////    };
////});

//builder.Services.AddRateLimiter(options =>
//{
//    /* Sign-in, registration and password reset.
//       Ten a minute per address: a person mistyping a password stays well
//       under it, a credential-stuffing script does not. */
//    options.AddPolicy("auth", httpContext =>
//        RateLimitPartition.GetFixedWindowLimiter(
//            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
//            factory: _ => new FixedWindowRateLimiterOptions
//            {
//                PermitLimit = 10,
//                Window = TimeSpan.FromMinutes(1),
//                QueueLimit = 0
//            }));

//    /* The contact form.
//       An open endpoint that writes a row on every call is a flooding target,
//       and the desk's own screen is what fills up. Five an hour is generous
//       for a person and useless to a script. */
//    options.AddPolicy("contact", httpContext =>
//        RateLimitPartition.GetFixedWindowLimiter(
//            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
//            factory: _ => new FixedWindowRateLimiterOptions
//            {
//                PermitLimit = 5,
//                Window = TimeSpan.FromHours(1),
//                QueueLimit = 0
//            }));

//    /* One handler for both policies. Without it a rejected request gets a
//       bare 429 with an empty body, which the frontend shows as a blank
//       error. */
//    options.OnRejected = async (context, token) =>
//    {
//        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

//        // The two windows differ, so a single "wait a minute" message would be
//        // wrong for one of them. The endpoint tells us which.
//        var isContact = context.HttpContext.Request.Path
//            .StartsWithSegments("/api/contact", StringComparison.OrdinalIgnoreCase);

//        await context.HttpContext.Response.WriteAsJsonAsync(
//            new
//            {
//                message = isContact
//                    ? "You have sent several messages already. Please wait a little before " +
//                      "sending another, or telephone the resort directly."
//                    : "Too many attempts. Please wait a minute and try again."
//            },
//            cancellationToken: token);
//    };
//});

//builder.Services.AddScoped<IGalleryRepository, GalleryRepository>();
//builder.Services.AddScoped<IGalleryService, GalleryService>();

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

///* The upload folder is created on demand by GalleryService, but making it
//   here means the first upload does not depend on the app pool having
//   directory-creation rights at that moment. */
//Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath,
//                                       "wwwroot", "uploads", "gallery"));

//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

///* ---------- Pipeline ----------

//   Order matters more here than it looks.

//   1. The exception handler goes FIRST so it wraps everything below it. Without
//      it, an unhandled exception is written by the developer exception page,
//      which calls Response.Clear() and discards the CORS headers that
//      UseCors had already queued. The browser then refuses the response and
//      reports "TypeError: Failed to fetch" with 0 B transferred - so the real
//      500 is invisible and every server fault looks like a network fault.

//   2. UseCors comes before UseHttpsRedirection. A preflight OPTIONS arriving
//      on http would otherwise get a 307 with no CORS headers on it.

//   3. UseStaticFiles serves wwwroot, which is where gallery uploads land.
//      Without it the upload succeeds and the image 404s.
//   -------------------------------------------------------------- */

//app.UseMiddleware<ApiExceptionMiddleware>();

//app.UseCors(CorsPolicy);
//app.UseHttpsRedirection();

//app.UseStaticFiles();      // wwwroot, including uploads/gallery

//app.UseRateLimiter();      // before authentication so floods are dropped early
//app.UseAuthentication();   // must come before UseAuthorization
//app.UseAuthorization();
//app.MapControllers();

//app.Run();



using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using AvioraResort.Data;
using AvioraResort.Middleware;
using AvioraResort.Repositories;
using AvioraResort.Security;
using AvioraResort.Services;

var builder = WebApplication.CreateBuilder(args);

/* ---------- Data access ---------- */
var connectionString = builder.Configuration.GetConnectionString("AvioraDB")
    ?? throw new InvalidOperationException("ConnectionStrings:AvioraDB is missing.");

builder.Services.AddSingleton(new SqlHelper(connectionString));

/* ---------- Dependency injection ----------

   Each pair appears ONCE. The previous version registered IUserRepository,
   IAuthService, IVillaRepository and IVillaService twice. The last
   registration wins, so nothing was broken - but a duplicate is a question
   the next reader has to answer before they can trust the list. */

builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IVillaRepository, VillaRepository>();
builder.Services.AddScoped<IVillaService, VillaService>();

builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();

builder.Services.AddScoped<IPricingRepository, PricingRepository>();
builder.Services.AddScoped<IPricingService, PricingService>();

builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<IInventoryService, InventoryService>();

builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IBookingService, BookingService>();

builder.Services.AddScoped<IDiningRepository, DiningRepository>();
builder.Services.AddScoped<IDiningService, DiningService>();

builder.Services.AddScoped<IGalleryRepository, GalleryRepository>();
builder.Services.AddScoped<IGalleryService, GalleryService>();

builder.Services.AddScoped<IInquiryRepository, InquiryRepository>();
builder.Services.AddScoped<IInquiryService, InquiryService>();

/* Google Sign-In. Scoped because it takes IUserRepository, which is. */
builder.Services.AddScoped<IGoogleAuthService, GoogleAuthService>();

/* Singletons: these hold configuration and nothing per-request.
   MailKit's own SmtpClient is created and disposed inside each send, which is
   the supported pattern - the client is not thread-safe and must not be
   shared. */
builder.Services.AddSingleton<IMediaService, MediaService>();
builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();

/* ---------- Options ----------

   AuthService takes IOptions<SecuritySettings> and IOptions<ResortSettings>.
   A missing Configure here throws at the FIRST REQUEST that resolves the
   service, not at startup - so a forgotten line looks like a broken endpoint
   rather than a broken configuration. */
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<ResortSettings>(builder.Configuration.GetSection("Resort"));
builder.Services.Configure<SecuritySettings>(builder.Configuration.GetSection("Security"));
builder.Services.Configure<GoogleAuthSettings>(builder.Configuration.GetSection("GoogleAuth"));

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
            // even if inbound claim mapping is changed later. NameClaimType is
            // what AdminInquiriesController reads to sign an outbound email.
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name,

            // No grace period on expiry. The default is five minutes, which
            // would keep an expired admin token alive longer than intended.
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

/* ---------- Rate limiting ----------

   Account lockout stops one account being guessed. This stops one IP address
   spraying a common password across many accounts, which lockout cannot see.

   BOTH policies must exist. An endpoint carrying [EnableRateLimiting("x")]
   with no policy "x" throws on the REQUEST, not at startup - so a missing one
   stays invisible until somebody hits that route. */
builder.Services.AddRateLimiter(options =>
{
    /* Sign-in, registration, forgot-password and reset-password.
       Ten a minute per address: a person mistyping a password stays well
       under it, a credential-stuffing script does not. */
    options.AddPolicy("auth", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));

    /* The contact form.
       An open endpoint that writes a row on every call is a flooding target,
       and the desk's own screen is what fills up. Five an hour is generous
       for a person and useless to a script. */
    options.AddPolicy("contact", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromHours(1),
                QueueLimit = 0
            }));

    /* One handler for both. Without it a rejected request gets a bare 429
       with an empty body, which the frontend shows as a blank error. */
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

        // The two windows differ, so a single "wait a minute" would be wrong
        // for one of them. The path tells us which.
        var isContact = context.HttpContext.Request.Path
            .StartsWithSegments("/api/contact", StringComparison.OrdinalIgnoreCase);

        await context.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                message = isContact
                    ? "You have sent several messages already. Please wait a little before " +
                      "sending another, or telephone the resort directly."
                    : "Too many attempts. Please wait a minute and try again."
            },
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

/* MediaService and GalleryService create these on demand, but making them at
   startup means the first upload does not depend on the app pool having
   directory-creation rights at that moment. The folder list matches
   MediaService.AllowedFolders. */
foreach (var folder in new[] { "gallery", "villas", "dining", "experiences" })
{
    Directory.CreateDirectory(
        Path.Combine(app.Environment.ContentRootPath, "wwwroot", "uploads", folder));
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

/* ---------- Pipeline ----------

   Order matters more here than it looks.

   1. The exception handler goes FIRST so it wraps everything below it.
      Without it, an unhandled exception is written by the developer exception
      page, which calls Response.Clear() and discards the CORS headers UseCors
      had already queued. The browser then refuses the response and reports
      "TypeError: Failed to fetch" with 0 B transferred - so the real 500 is
      invisible and every server fault looks like a network fault.

   2. UseCors comes before UseHttpsRedirection. A preflight OPTIONS arriving
      on http would otherwise get a 307 with no CORS headers on it.

   3. UseStaticFiles serves wwwroot, which is where uploads land. Without it
      an upload succeeds and the image 404s - which reads as a broken upload
      rather than a missing middleware line.
   ---------------------------------------------------------------- */

app.UseMiddleware<ApiExceptionMiddleware>();

app.UseCors(CorsPolicy);
app.UseHttpsRedirection();

app.UseStaticFiles();      // wwwroot, including uploads/*

app.UseRateLimiter();      // before authentication so floods are dropped early
app.UseAuthentication();   // must come before UseAuthorization
app.UseAuthorization();
app.MapControllers();

app.Run();
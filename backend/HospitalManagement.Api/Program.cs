using System.Text;
using HospitalManagement.Application;
using HospitalManagement.Application.Common.Security;
using HospitalManagement.Infrastructure;
using HospitalManagement.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.Configure<RouteOptions>(options =>
{
    options.LowercaseUrls = true;
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "CareFlow_Super_Secret_JWT_Signing_Key_2026_Minimum_32_Bytes!";
var jwtIssuer = builder.Configuration["JwtSettings:Issuer"] ?? "CareFlowHMS";
var jwtAudience = builder.Configuration["JwtSettings:Audience"] ?? "CareFlowHMSClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure Swagger / OpenAPI documentation
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CareFlow HMS Developer Portal",
        Version = "v1",
        Description = """
            ### 🏥 CareFlow Hospital Management System — Developer Portal
            **Production-grade REST API for Clinical Operations, Patient Records & Healthcare Workflows**

            `API Version: v1` &nbsp;|&nbsp; `OpenAPI: 3.0` &nbsp;|&nbsp; `Auth: JWT Bearer` &nbsp;|&nbsp; `Environment: Development / Local`

            ---

            ### 📋 Core HMS Modules & Capabilities

            | Module | Capabilities & Workflows | Canonical Endpoints |
            | :--- | :--- | :--- |
            | **🧑‍⚕️ Patients** | Patient Registration, Demographics, Blood Group, Medical Record Tracking | `/api/v1/patients` |
            | **📅 Appointments** | Scheduling, Availability Slots, Conflict Detection & Status Workflows | `/api/v1/appointments` |
            | **🩺 Doctors** | Clinical Profiles, Specialties, Weekly Availability & Schedule Exceptions | `/api/v1/doctors` |
            | **🏢 Departments** | Hospital Organizational Units, Specialty Allocation & Staff Directory | `/api/v1/doctors/departments` |
            | **🔐 Authentication** | JWT Bearer Tokens, Role Claims, Password Management & Profile Updates | `/api/v1/auth` |
            | **👥 Admin Users** | Direct Account Management, Role Elevation & Staff Status Activation | `/api/v1/admin/users` |
            | **📋 Staff Onboarding** | Self-Service Registration, Invitation Validation & Approvals | `/api/v1/staff-registration` |

            ---

            ### 🔐 Authentication & Security Guidance
            - **Quick Staff Login**: Click the green/blue **Authorize** button in the header navigation to authenticate with hospital credentials.
            - **Supported Roles**: `Admin`, `HospitalManager`, `Doctor`, `Nurse`, `Receptionist`, `Pharmacist`, `LabTechnician`, `Patient`.
            - **Session Isolation**: JWT tokens are retained strictly in client memory during the session and are cleared automatically upon logout or tab closure.
            """,
        Contact = new OpenApiContact
        {
            Name = "CareFlow Engineering Team",
            Email = "support@careflow.local"
        }
    });

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);
    }

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Add Clean Architecture layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// Configure CORS for Frontend React app
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure Rate Limiting for Auth and Public Endpoints
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("AuthPolicy", opt =>
    {
        opt.PermitLimit = 15;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
});

var app = builder.Build();

app.UseSerilogRequestLogging();

app.UseStaticFiles();

// Enable Swagger UI middleware
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "CareFlow HMS API v1");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "CareFlow HMS Developer Portal";

    options.InjectStylesheet("/swagger-ui/careflow.css");
    options.InjectStylesheet("/swagger-ui/custom-auth.css");
    options.InjectJavascript("/swagger-ui/custom-auth.js");

    options.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
    options.DefaultModelsExpandDepth(-1);
    options.DisplayRequestDuration();
    options.EnableFilter();
});

app.UseCors("AllowFrontend");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

// Ensure database migration / creation & seed users on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<HospitalDbContext>();
        var passwordHasher = services.GetRequiredService<IPasswordHasher>();
        var logger = services.GetRequiredService<ILogger<Program>>();

        dbContext.Database.EnsureCreated();
        await DbInitializer.SeedAsync(dbContext, passwordHasher, logger);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "An error occurred while initializing the database.");
    }
}

app.Run();

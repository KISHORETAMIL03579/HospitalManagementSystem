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
        Title = "CareFlow Hospital Management System API",
        Version = "v1",
        Description = "Production-grade Clean Architecture REST API for Hospital Management System (HMS)"
    });

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

// Enable Swagger UI middleware
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "CareFlow HMS API v1");
    options.RoutePrefix = "swagger";
    options.EnablePersistAuthorization();
    options.HeadContent = @"
        <script>
        window.addEventListener('load', function () {
            var checkUi = setInterval(function () {
                if (window.ui) {
                    clearInterval(checkUi);
                    var origInterceptor = window.ui.getConfigs().responseInterceptor;
                    window.ui.getConfigs().responseInterceptor = function (response) {
                        if (origInterceptor) {
                            response = origInterceptor(response);
                        }
                        try {
                            if (response && response.status === 200 && response.text) {
                                var data = JSON.parse(response.text);
                                if (data && data.token) {
                                    window.ui.preauthorizeApiKey('Bearer', data.token);
                                    console.log('CareFlow HMS: Swagger UI automatically authorized Bearer token!');
                                }
                            }
                        } catch (e) {}
                        return response;
                    };

                    var observer = new MutationObserver(function () {
                        var modal = document.querySelector('.swagger-ui .dialog-ux .modal-ux-content');
                        if (modal && !document.getElementById('careflow-modal-login')) {
                            var container = document.createElement('div');
                            container.id = 'careflow-modal-login';
                            container.style.cssText = 'margin-bottom: 20px; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; font-family: sans-serif;';
                            container.innerHTML = `
                                <div style=""margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;"">
                                    <h4 style=""margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;"">🔑 Option 1: Login with Username & Password</h4>
                                    <p style=""margin: 4px 0 0 0; font-size: 11px; color: #64748b;"">Enter hospital credentials to automatically fetch & authorize JWT token.</p>
                                </div>
                                <div style=""display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;"">
                                    <input id=""swag-user"" type=""text"" placeholder=""Username or Email"" value=""admin@careflow.com"" style=""flex: 1; min-width: 140px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none;"" />
                                    <input id=""swag-pass"" type=""password"" placeholder=""Password"" value=""Admin123!"" style=""flex: 1; min-width: 140px; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; outline: none;"" />
                                </div>
                                <div style=""display: flex; align-items: center; justify-content: space-between;"">
                                    <button id=""swag-login-btn"" type=""button"" style=""background: #2563eb; color: #ffffff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; transition: background 0.2s;"">
                                        Login & Authorize Now
                                    </button>
                                    <span id=""swag-msg"" style=""font-size: 12px; font-weight: 600;""></span>
                                </div>
                                <div style=""margin-top: 16px; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-weight: 700; color: #0f172a; font-size: 13px;"">
                                    🔒 Option 2: Direct Bearer Token Input (Manual)
                                </div>
                            `;
                            modal.insertBefore(container, modal.firstChild);

                            document.getElementById('swag-login-btn').addEventListener('click', async function () {
                                var u = document.getElementById('swag-user').value;
                                var p = document.getElementById('swag-pass').value;
                                var msg = document.getElementById('swag-msg');
                                msg.style.color = '#64748b';
                                msg.innerText = 'Authenticating...';
                                try {
                                    var res = await fetch('/api/v1/Auth/login', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ usernameOrEmail: u, password: p })
                                    });
                                    var data = await res.json();
                                    if (res.ok && data.token) {
                                        window.ui.preauthorizeApiKey('Bearer', data.token);
                                        msg.style.color = '#16a34a';
                                        msg.innerText = '✓ Authorized as ' + (data.user ? data.user.fullName : 'User') + '!';
                                    } else {
                                        msg.style.color = '#dc2626';
                                        msg.innerText = '❌ ' + (data.message || 'Login failed.');
                                    }
                                } catch (e) {
                                    msg.style.color = '#dc2626';
                                    msg.innerText = '❌ Request failed.';
                                }
                            });
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                }
            }, 200);
        });
        </script>";
});

app.UseCors("AllowFrontend");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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

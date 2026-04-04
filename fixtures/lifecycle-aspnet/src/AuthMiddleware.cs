using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.Tasks;

namespace LifecycleAspNet.Auth;

public sealed class AuthMiddleware
{
    private readonly RequestDelegate _next;
    private readonly TokenValidationParameters _parameters;

    public AuthMiddleware(RequestDelegate next)
    {
        _next = next;
        _parameters = BuildValidationParameters();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
        {
            await _next(context);
            return;
        }

        var token = authorizationHeader.ToString().Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase);
        var handler = new JwtSecurityTokenHandler();

        try
        {
            var principal = handler.ValidateToken(token, _parameters, out _);
            context.User = principal;
        }
        catch (SecurityTokenException)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return;
        }

        await _next(context);
    }

    private static TokenValidationParameters BuildValidationParameters()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "https://fixture.example",
            ValidAudience = "admin-dashboard",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes("fixture-signing-key-fixture-signing-key"))
        };
    }
}

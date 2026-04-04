using Microsoft.IdentityModel.Tokens;

namespace NestedFixture.Api.Auth;

public sealed class AuthHandler
{
    public TokenValidationParameters BuildValidationParameters()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true
        };
    }
}

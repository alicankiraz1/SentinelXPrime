using Microsoft.IdentityModel.Tokens;

namespace NestedFixture.Web;

public sealed class OutsideOnlyAuthHandler
{
    public TokenValidationParameters BuildValidationParameters()
    {
        return new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = true
        };
    }
}

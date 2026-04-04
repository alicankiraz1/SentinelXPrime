using Microsoft.AspNetCore.Mvc;

namespace LifecycleAspNet.Controllers;

[ApiController]
[Route("dashboard")]
public sealed class DashboardController : ControllerBase
{
    [HttpGet("summary")]
    public IActionResult GetSummary()
    {
        return Ok(new
        {
            status = "ok",
            cards = 3
        });
    }
}

using RentalWise.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Application.Services;

public interface IAuthService
{
    Task<string> RegisterAsync(RegisterDto dto, string role);
    Task<string> LoginAsync(LoginDto dto);
}

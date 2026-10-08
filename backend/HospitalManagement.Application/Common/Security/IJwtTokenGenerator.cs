using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Common.Security;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
    string GenerateRefreshToken();
}

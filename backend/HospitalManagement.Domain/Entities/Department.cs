using HospitalManagement.Domain.Common;

namespace HospitalManagement.Domain.Entities;

public class Department : BaseEntity
{
    public int DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<Doctor> Doctors { get; set; } = new List<Doctor>();
}

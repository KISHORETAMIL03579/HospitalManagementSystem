using HospitalManagement.Domain.Enums;

namespace HospitalManagement.Application.Appointments.DTOs;

public class UpdateAppointmentStatusRequest
{
    public AppointmentStatus Status { get; set; }
    public string? Notes { get; set; }
}

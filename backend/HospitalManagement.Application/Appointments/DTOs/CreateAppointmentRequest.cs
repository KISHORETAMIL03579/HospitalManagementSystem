namespace HospitalManagement.Application.Appointments.DTOs;

public class CreateAppointmentRequest
{
    public int PatientId { get; set; }
    public int DoctorId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string TimeSlot { get; set; } = "09:00"; // HH:mm format
    public string Reason { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

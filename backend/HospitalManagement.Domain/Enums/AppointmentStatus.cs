namespace HospitalManagement.Domain.Enums;

public enum AppointmentStatus
{
    Pending = 0,
    Confirmed = 10,
    CheckedIn = 20,
    InConsultation = 30,
    Completed = 40,
    Cancelled = 50,
    NoShow = 60
}

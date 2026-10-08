using FluentValidation;
using HospitalManagement.Application.Appointments.DTOs;

namespace HospitalManagement.Application.Appointments.Validators;

public class CreateAppointmentValidator : AbstractValidator<CreateAppointmentRequest>
{
    public CreateAppointmentValidator()
    {
        RuleFor(x => x.PatientId).GreaterThan(0).WithMessage("Valid patient selection is required.");
        RuleFor(x => x.DoctorId).GreaterThan(0).WithMessage("Valid doctor selection is required.");
        RuleFor(x => x.AppointmentDate).GreaterThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Appointment date cannot be in the past.");
        RuleFor(x => x.TimeSlot).NotEmpty().WithMessage("Time slot is required.");
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(200).WithMessage("Reason for visit is required.");
    }
}

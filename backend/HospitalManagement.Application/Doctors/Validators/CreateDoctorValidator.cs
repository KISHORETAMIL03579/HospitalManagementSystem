using FluentValidation;
using HospitalManagement.Application.Doctors.DTOs;

namespace HospitalManagement.Application.Doctors.Validators;

public class CreateDoctorValidator : AbstractValidator<CreateDoctorRequest>
{
    public CreateDoctorValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LicenseNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Specialization).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DepartmentId).GreaterThan(0);
        RuleFor(x => x.Phone).NotEmpty().MaximumLength(20);
    }
}

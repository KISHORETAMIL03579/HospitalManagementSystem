using FluentValidation;
using HospitalManagement.Application.Patients.DTOs;

namespace HospitalManagement.Application.Patients.Validators;

public class CreatePatientValidator : AbstractValidator<CreatePatientRequest>
{
    public CreatePatientValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(50).WithMessage("First name cannot exceed 50 characters.");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(50).WithMessage("Last name cannot exceed 50 characters.");

        RuleFor(x => x.DateOfBirth)
            .NotEmpty().WithMessage("Date of birth is required.")
            .LessThan(DateTime.UtcNow).WithMessage("Date of birth must be in the past.");

        RuleFor(x => x.Gender)
            .IsInEnum().WithMessage("A valid gender selection is required.");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Primary contact phone number is required.")
            .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters.");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Invalid email format.")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}


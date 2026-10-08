using HospitalManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HospitalManagement.Infrastructure.Persistence.Configurations;

public class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.ToTable("Patients");

        builder.HasKey(p => p.PatientId);

        builder.Property(p => p.MedicalRecordNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(p => p.MedicalRecordNumber)
            .IsUnique();

        builder.Property(p => p.FirstName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.LastName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.DateOfBirth)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(p => p.Gender)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(p => p.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(p => p.Email)
            .HasMaxLength(100);

        builder.Property(p => p.Address)
            .HasMaxLength(200);

        builder.Property(p => p.EmergencyContactName)
            .HasMaxLength(100);

        builder.Property(p => p.EmergencyContactPhone)
            .HasMaxLength(20);

        builder.Property(p => p.RowVersion)
            .IsRowVersion();
    }
}


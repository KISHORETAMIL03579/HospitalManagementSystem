using HospitalManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HospitalManagement.Infrastructure.Persistence.Configurations;

public class DoctorScheduleExceptionConfiguration : IEntityTypeConfiguration<DoctorScheduleException>
{
    public void Configure(EntityTypeBuilder<DoctorScheduleException> builder)
    {
        builder.ToTable("DoctorScheduleExceptions");

        builder.HasKey(e => e.ExceptionId);

        builder.Property(e => e.Date)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(e => e.StartTime)
            .HasColumnType("time");

        builder.Property(e => e.EndTime)
            .HasColumnType("time");

        builder.Property(e => e.ExceptionType)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(e => e.Reason)
            .HasMaxLength(250);

        builder.HasOne(e => e.Doctor)
            .WithMany(d => d.ScheduleExceptions)
            .HasForeignKey(e => e.DoctorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Composite index for querying date-specific exceptions per doctor
        builder.HasIndex(e => new { e.DoctorId, e.Date });
    }
}


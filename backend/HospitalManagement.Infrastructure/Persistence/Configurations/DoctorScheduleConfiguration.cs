using HospitalManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HospitalManagement.Infrastructure.Persistence.Configurations;

public class DoctorScheduleConfiguration : IEntityTypeConfiguration<DoctorSchedule>
{
    public void Configure(EntityTypeBuilder<DoctorSchedule> builder)
    {
        builder.ToTable("DoctorSchedules");

        builder.HasKey(s => s.ScheduleId);

        builder.Property(s => s.DayOfWeek)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(s => s.StartTime)
            .HasColumnType("time")
            .IsRequired();

        builder.Property(s => s.EndTime)
            .HasColumnType("time")
            .IsRequired();

        builder.Property(s => s.SlotDurationMinutes)
            .IsRequired()
            .HasDefaultValue(30);

        builder.Property(s => s.SessionName)
            .HasMaxLength(100);

        builder.HasOne(s => s.Doctor)
            .WithMany(d => d.Schedules)
            .HasForeignKey(s => s.DoctorId)
            .OnDelete(DeleteBehavior.Cascade);

        // Composite index for fast weekday lookup per doctor
        builder.HasIndex(s => new { s.DoctorId, s.DayOfWeek });
    }
}


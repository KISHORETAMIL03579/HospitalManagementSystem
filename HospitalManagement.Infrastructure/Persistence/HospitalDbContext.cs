using HospitalManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HospitalManagement.Infrastructure.Persistence;

public class HospitalDbContext : DbContext
{
    public HospitalDbContext(DbContextOptions<HospitalDbContext> options) : base(options)
    {
    }

    public DbSet<Patient> Patients => Set<Patient>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HospitalDbContext).Assembly);
    }
}


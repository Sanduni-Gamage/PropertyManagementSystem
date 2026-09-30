using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using RentalWise.Domain.Entities;
using RentalWise.Domain.Entities.Messaging;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Region> Regions => Set<Region>();
    public DbSet<District> Districts => Set<District>();
    public DbSet<Suburb> Suburbs => Set<Suburb>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<PropertyMedia> PropertyMedia => Set<PropertyMedia>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Lease> Leases => Set<Lease>();
    public DbSet<Landlord> LandLords => Set<Landlord>();
    public DbSet<Payment> Payments => Set<Payment>();

    // Messaging
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<ConversationParticipant> ConversationParticipants => Set<ConversationParticipant>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<MessageAttachment> MessageAttachments => Set<MessageAttachment>();
    public DbSet<MessageRead> MessageReads => Set<MessageRead>();

    // Maintenance
    public DbSet<MaintenanceRequest> MaintenanceRequests => Set<MaintenanceRequest>();
    public DbSet<MaintenanceRequestEvent> MaintenanceRequestEvents => Set<MaintenanceRequestEvent>();

    // Tenancy applications
    public DbSet<RentalApplication> RentalApplications => Set<RentalApplication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureMessaging(modelBuilder);
        ConfigureMaintenance(modelBuilder);
        ConfigureRentalApplications(modelBuilder);

        // Only show active landlords
        modelBuilder.Entity<Landlord>()
            .HasQueryFilter(l => l.IsActive);

        // Only show active properties
        modelBuilder.Entity<Property>()
            .HasQueryFilter(p => p.IsActive);

        // Property - decimal configuration
        modelBuilder.Entity<Property>()
            .Property(p => p.RentAmount)
            .HasPrecision(18, 2); // 18 total digits, 2 after the decimal point

        modelBuilder.Entity<Lease>()
            .Property(l => l.RentAmount)
            .HasPrecision(18, 2); 

        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Property>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete from Identity

        modelBuilder.Entity<Property>()
            .HasOne(p => p.Landlord)
            .WithMany(l => l.Properties)
            .HasForeignKey(p => p.LandlordId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Landlord>()
            .HasOne(l => l.User)
            .WithOne()
            .HasForeignKey<Landlord>(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Tenant>()
            .HasOne(t => t.User)
            .WithOne()
            .HasForeignKey<Tenant>(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PropertyMedia>()
            .HasOne(pm => pm.Property)
            .WithMany(p => p.Media)
            .HasForeignKey(pm => pm.PropertyId)
            .IsRequired(false)  // Make navigation optional
            .OnDelete(DeleteBehavior.Cascade);

        // Add Fluent API configuration here if needed
        modelBuilder.Entity<Lease>()
            .HasOne(l => l.Property)
            .WithMany(p => p.Leases)
            .HasForeignKey(l => l.PropertyId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict); //prevent deleting a Tenant or Property that has active leases

        modelBuilder.Entity<Lease>()
            .HasOne(l => l.Tenant)
            .WithMany(t => t.Leases)
            .HasForeignKey(l => l.TenantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Landlord)
            .WithOne(l => l.User)
            .HasForeignKey<Landlord>(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ApplicationUser>()
            .HasOne(u => u.Tenant)
            .WithOne(t => t.User)
            .HasForeignKey<Tenant>(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<District>()
            .HasOne(d => d.Region)
            .WithMany(r => r.Districts)
            .HasForeignKey(d => d.RegionId);

        modelBuilder.Entity<Suburb>()
            .HasOne(s => s.District)
            .WithMany(d => d.Suburbs)
            .HasForeignKey(s => s.DistrictId);

        modelBuilder.Entity<Property>()
            .HasOne(p => p.Suburb)
            .WithMany()
            .HasForeignKey(p => p.SuburbId);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Tenant)
            .WithMany(t => t.Payments)
            .HasForeignKey(p => p.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Lease)
            .WithMany(l => l.Payments)
            .HasForeignKey(p => p.LeaseId)
            .OnDelete(DeleteBehavior.Cascade);



    }

    private static void ConfigureRentalApplications(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RentalApplication>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.Message).HasMaxLength(1000);
            entity.Property(a => a.DecisionNote).HasMaxLength(500);

            // Landlord's queue: applications per listing, newest first within a status.
            entity.HasIndex(a => new { a.PropertyId, a.Status });

            // Tenant's own list.
            entity.HasIndex(a => new { a.TenantId, a.CreatedAtUtc });

            // Optional navigation for the same reason as MaintenanceRequest: the listing
            // may be delisted while the application still needs to be visible.
            entity.HasOne(a => a.Property)
                  .WithMany()
                  .HasForeignKey(a => a.PropertyId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Cascade);

            // Restrict keeps a single cascade path into this table, as Property and Tenant
            // both descend from AspNetUsers.
            entity.HasOne(a => a.Tenant)
                  .WithMany()
                  .HasForeignKey(a => a.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);

            // The lease an approval produced. NoAction because the lease is the result of
            // this row, not its owner, and deleting one should not silently remove the other.
            entity.HasOne(a => a.Lease)
                  .WithMany()
                  .HasForeignKey(a => a.LeaseId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.NoAction);
        });
    }

    private static void ConfigureMaintenance(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MaintenanceRequest>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.Title)
                  .IsRequired()
                  .HasMaxLength(200);

            entity.Property(r => r.Description)
                  .IsRequired()
                  .HasMaxLength(4000);

            entity.Property(r => r.EscalationReason).HasMaxLength(500);
            entity.Property(r => r.AiSummary).HasMaxLength(1000);
            entity.Property(r => r.AiReasoning).HasMaxLength(2000);
            entity.Property(r => r.ProposedLandlordMessage).HasMaxLength(2000);
            entity.Property(r => r.AiModel).HasMaxLength(100);

            // Replaying the same key must not create a second request.
            entity.HasIndex(r => r.IdempotencyKey).IsUnique();

            // Backs duplicate detection ("is there already an open request like this?")
            // and the landlord's per-property view.
            entity.HasIndex(r => new { r.PropertyId, r.Status });

            // Backs the tenant's own list, newest first.
            entity.HasIndex(r => new { r.TenantId, r.CreatedAtUtc });

            // Property carries a global IsActive query filter. Requests are intentionally
            // NOT filtered the same way: delisting a property must not make its
            // outstanding maintenance history disappear. The navigation is therefore
            // optional (a LEFT JOIN), so a request whose property is filtered out still
            // comes back with a null Property rather than vanishing from the result set.
            // Same reason Lease and PropertyMedia are configured this way.
            entity.HasOne(r => r.Property)
                  .WithMany()
                  .HasForeignKey(r => r.PropertyId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Cascade);

            // Restrict here keeps a single cascade path into this table. Both Property and
            // Tenant ultimately hang off AspNetUsers, and SQL Server rejects multiple
            // cascade paths to the same table.
            entity.HasOne(r => r.Tenant)
                  .WithMany()
                  .HasForeignKey(r => r.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MaintenanceRequestEvent>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Detail).HasMaxLength(2000);

            entity.HasIndex(e => new { e.MaintenanceRequestId, e.CreatedAtUtc });

            entity.HasOne(e => e.MaintenanceRequest)
                  .WithMany(r => r.Events)
                  .HasForeignKey(e => e.MaintenanceRequestId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureMessaging(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Conversation>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.Property(c => c.IsArchived)
                  .HasDefaultValue(false);

            entity.HasIndex(c => c.CreatedAtUtc);
            entity.HasIndex(c => c.PropertyId);
        });

        modelBuilder.Entity<ConversationParticipant>(entity =>
        {
            entity.HasKey(p => p.Id);

            entity.HasIndex(p => p.UserId);

            // A user may only appear once per conversation.
            entity.HasIndex(p => new { p.ConversationId, p.UserId })
                  .IsUnique();

            entity.HasOne(p => p.Conversation)
                  .WithMany(c => c.Participants)
                  .HasForeignKey(p => p.ConversationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.HasKey(m => m.Id);

            entity.Property(m => m.Body)
                  .IsRequired()
                  .HasMaxLength(5000)
                  .HasColumnType("nvarchar(max)");

            entity.Property(m => m.IsDeleted)
                  .HasDefaultValue(false);

            entity.HasIndex(m => m.SenderId);

            // Backs the common "newest messages in a thread" read.
            entity.HasIndex(m => new { m.ConversationId, m.CreatedAtUtc });

            entity.HasOne(m => m.Conversation)
                  .WithMany(c => c.Messages)
                  .HasForeignKey(m => m.ConversationId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Reply link is FK-only (no navigation). NoAction because a self-referencing
            // cascade is not permitted by SQL Server.
            entity.HasOne<Message>()
                  .WithMany()
                  .HasForeignKey(m => m.ReplyToMessageId)
                  .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<MessageAttachment>(entity =>
        {
            entity.HasKey(a => a.Id);

            entity.Property(a => a.FileName)
                  .IsRequired()
                  .HasMaxLength(256);

            entity.Property(a => a.ContentType)
                  .IsRequired()
                  .HasMaxLength(128);

            entity.Property(a => a.Url)
                  .IsRequired()
                  .HasMaxLength(1024);

            entity.HasOne(a => a.Message)
                  .WithMany(m => m.Attachments)
                  .HasForeignKey(a => a.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MessageRead>(entity =>
        {
            entity.HasKey(r => new { r.MessageId, r.UserId });

            entity.HasIndex(r => r.UserId);

            entity.HasOne(r => r.Message)
                  .WithMany(m => m.Reads)
                  .HasForeignKey(r => r.MessageId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            // Soft delete for Landlord
            if (entry.Entity is Landlord landlord && entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                landlord.IsActive = false;

                // Deactivate related properties
                var relatedProperties = Properties.Where(p => p.UserId == landlord.UserId);
                foreach (var prop in relatedProperties)
                {
                    prop.IsActive = false;
                }
            }

            // Soft delete for Property
            if (entry.Entity is Property property && entry.State == EntityState.Deleted)
            {
                entry.State = EntityState.Modified;
                property.IsActive = false;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
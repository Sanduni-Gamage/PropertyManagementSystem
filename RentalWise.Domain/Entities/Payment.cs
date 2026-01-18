using RentalWise.Domain.Enum;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Entities;

public class Payment
{
    public int Id { get; set; }

    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    public int LeaseId { get; set; }
    public Lease Lease { get; set; } = null!;

    public decimal Amount { get; set; }
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    public PaymentMethod Method { get; set; }
    public PaymentStatus Status { get; set; }

    //public string? TransactionReference { get; set; } // optional, for Stripe/PayPal/etc.

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
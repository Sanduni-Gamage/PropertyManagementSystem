using RentalWise.Domain.Enum;
using RentalWise.Domain.Policies;

namespace RentalWise.Tests;


/// The escalation rules are the part of the agent that must not be able to go wrong, so
/// they live in plain code and are pinned by tests rather than being left to the model.

public class MaintenanceSafetyPolicyTests
{
    [Theory]
    [InlineData(MaintenanceUrgency.Low)]
    [InlineData(MaintenanceUrgency.Medium)]
    [InlineData(MaintenanceUrgency.High)]
    [InlineData(MaintenanceUrgency.Emergency)]
    public void GasOrFumes_always_escalates_whatever_urgency_the_agent_assigned(MaintenanceUrgency urgency)
    {
        // This is the case the design exists for - a model that rates a gas smell as "Low"
        // must not be able to suppress the escalation.
        Assert.True(MaintenanceSafetyPolicy.RequiresUrgentEscalation(MaintenanceCategory.GasOrFumes, urgency));
    }

    [Theory]
    [InlineData(MaintenanceCategory.Plumbing)]
    [InlineData(MaintenanceCategory.Appliance)]
    [InlineData(MaintenanceCategory.Grounds)]
    [InlineData(MaintenanceCategory.Other)]
    public void Emergency_urgency_escalates_in_every_category(MaintenanceCategory category)
    {
        Assert.True(MaintenanceSafetyPolicy.RequiresUrgentEscalation(category, MaintenanceUrgency.Emergency));
    }

    [Theory]
    [InlineData(MaintenanceCategory.Electrical)]
    [InlineData(MaintenanceCategory.Flooding)]
    [InlineData(MaintenanceCategory.StructuralOrRoof)]
    [InlineData(MaintenanceCategory.SmokeAlarm)]
    public void Risk_categories_escalate_at_high_but_not_below(MaintenanceCategory category)
    {
        Assert.True(MaintenanceSafetyPolicy.RequiresUrgentEscalation(category, MaintenanceUrgency.High));
        Assert.False(MaintenanceSafetyPolicy.RequiresUrgentEscalation(category, MaintenanceUrgency.Medium));
        Assert.False(MaintenanceSafetyPolicy.RequiresUrgentEscalation(category, MaintenanceUrgency.Low));
    }

    [Theory]
    [InlineData(MaintenanceCategory.Plumbing, MaintenanceUrgency.Medium)]
    [InlineData(MaintenanceCategory.Appliance, MaintenanceUrgency.High)]
    [InlineData(MaintenanceCategory.PestControl, MaintenanceUrgency.Medium)]
    [InlineData(MaintenanceCategory.Grounds, MaintenanceUrgency.Low)]
    public void Ordinary_issues_do_not_escalate(MaintenanceCategory category, MaintenanceUrgency urgency)
    {
        Assert.False(MaintenanceSafetyPolicy.RequiresUrgentEscalation(category, urgency));
    }

    [Fact]
    public void Escalated_issues_get_safety_advice_and_a_reason()
    {
        var advice = MaintenanceSafetyPolicy.SafetyAdvice(MaintenanceCategory.GasOrFumes, MaintenanceUrgency.Low);
        var reason = MaintenanceSafetyPolicy.EscalationReason(MaintenanceCategory.GasOrFumes, MaintenanceUrgency.Low);

        Assert.NotEmpty(advice);
        Assert.False(string.IsNullOrWhiteSpace(reason));
    }

    [Fact]
    public void Non_escalated_issues_get_no_advice_and_no_reason()
    {
        var advice = MaintenanceSafetyPolicy.SafetyAdvice(MaintenanceCategory.Grounds, MaintenanceUrgency.Low);
        var reason = MaintenanceSafetyPolicy.EscalationReason(MaintenanceCategory.Grounds, MaintenanceUrgency.Low);

        Assert.Empty(advice);
        Assert.Null(reason);
    }

    [Fact]
    public void Gas_advice_tells_the_tenant_to_leave_before_anything_else()
    {
        var advice = MaintenanceSafetyPolicy.SafetyAdvice(MaintenanceCategory.GasOrFumes, MaintenanceUrgency.High);

        Assert.Contains("Leave the property", advice[0]);
    }

    [Fact]
    public void Every_escalation_says_it_does_not_replace_emergency_services()
    {
        // Each escalated category must carry the disclaimer, so the agent is never the last
        // line of defence in a genuine emergency.
        var categories = System.Enum.GetValues<MaintenanceCategory>();

        foreach (var category in categories)
        {
            var advice = MaintenanceSafetyPolicy.SafetyAdvice(category, MaintenanceUrgency.Emergency);

            Assert.NotEmpty(advice);
            Assert.Contains(advice, line => line.Contains("emergency services", StringComparison.OrdinalIgnoreCase));
        }
    }
}

using RentalWise.Domain.Enum;

namespace RentalWise.Domain.Policies;


/// Safety escalation rules for maintenance issues.
/// This is deliberately plain, deterministic code rather than something the language model
/// decides. The agent proposes a category and urgency; this policy decides whether the
/// issue is escalated and what safety guidance the tenant is shown. A model that
/// under-rates a gas leak therefore cannot suppress the escalation.

public static class MaintenanceSafetyPolicy
{

    /// Categories that always escalate, whatever urgency the agent assigned, because the
    /// worst case is severe and the tenant is not in a position to judge severity.
   
    private static readonly MaintenanceCategory[] AlwaysEscalate =
    {
        MaintenanceCategory.GasOrFumes
    };

    
    /// Categories that escalate once the issue is rated High or above.
    
    private static readonly MaintenanceCategory[] EscalateWhenHigh =
    {
        MaintenanceCategory.Electrical,
        MaintenanceCategory.Flooding,
        MaintenanceCategory.StructuralOrRoof,
        MaintenanceCategory.SmokeAlarm
    };

    
    /// True when the issue must be surfaced to the landlord as urgent and the tenant shown
    /// safety guidance before anything else.
   
    public static bool RequiresUrgentEscalation(MaintenanceCategory category, MaintenanceUrgency urgency)
    {
        if (urgency == MaintenanceUrgency.Emergency)
            return true;

        if (AlwaysEscalate.Contains(category))
            return true;

        return urgency >= MaintenanceUrgency.High && EscalateWhenHigh.Contains(category);
    }

   
    /// Safety steps shown to the tenant when an issue escalates. Deliberately generic:
    /// it points at emergency services and the tenant's own supplier rather than naming
    /// contractors, and the agent is never permitted to contact anyone itself.
  
    public static IReadOnlyList<string> SafetyAdvice(MaintenanceCategory category, MaintenanceUrgency urgency)
    {
        if (!RequiresUrgentEscalation(category, urgency))
            return Array.Empty<string>();

        var advice = new List<string>();

        switch (category)
        {
            case MaintenanceCategory.GasOrFumes:
                advice.Add("Leave the property now and take anyone else with you.");
                advice.Add("Do not use light switches, appliances, matches or anything that could spark.");
                advice.Add("Once outside, call your gas supplier's emergency line. If anyone feels unwell or you suspect fire, call 111.");
                break;

            case MaintenanceCategory.Electrical:
                advice.Add("Do not touch exposed wiring, wet switches or the affected appliance.");
                advice.Add("If it is safe to reach, switch the circuit off at the switchboard.");
                advice.Add("Call 111 immediately if there is smoke, fire, burning smell or anyone has had a shock.");
                break;

            case MaintenanceCategory.Flooding:
                advice.Add("Turn the water off at the mains or the nearest isolating valve if you can reach it safely.");
                advice.Add("Keep clear of water near power points, light fittings or the switchboard.");
                advice.Add("Move what you can out of the way, and call 111 if anyone is at risk.");
                break;

            case MaintenanceCategory.StructuralOrRoof:
                advice.Add("Stay out of the affected room and keep others away from it.");
                advice.Add("Do not try to prop up or repair anything yourself.");
                advice.Add("Call 111 if any part of the building looks like it could come down.");
                break;

            case MaintenanceCategory.SmokeAlarm:
                advice.Add("Treat the property as having no working smoke alarm until it is fixed.");
                advice.Add("Avoid anything that raises fire risk, such as candles, heaters left running or cooking unattended.");
                advice.Add("Working smoke alarms are the landlord's legal responsibility, so this has been flagged as urgent.");
                break;

            default:
                advice.Add("Keep yourself and anyone else in the property away from the affected area.");
                advice.Add("Do not attempt a repair yourself.");
                advice.Add("Call 111 if there is any immediate risk to someone's safety.");
                break;
        }

        advice.Add("This request has been flagged to your landlord as urgent. It does not replace calling emergency services.");
        return advice;
    }

 
    /// Human-readable justification for the escalation, stored on the request so the
    /// decision can be explained later without re-running the model.
    
    public static string? EscalationReason(MaintenanceCategory category, MaintenanceUrgency urgency)
    {
        if (!RequiresUrgentEscalation(category, urgency))
            return null;

        if (urgency == MaintenanceUrgency.Emergency)
            return $"Rated {urgency}, which always escalates regardless of category.";

        if (AlwaysEscalate.Contains(category))
            return $"Category {category} always escalates because the worst case is severe.";

        return $"Category {category} escalates at urgency {urgency} or above.";
    }
}

namespace HospitalManagement.Domain.Enums;

public enum EmailDeliveryStatus
{
    Queued = 0,
    Sent = 1,
    Delivered = 2,
    Failed = 3,
    Bounced = 4,
    Retrying = 5
}

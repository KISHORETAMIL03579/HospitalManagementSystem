namespace HospitalManagement.Application.Auth.Exceptions;

public class AccountInactiveException : Exception
{
    public AccountInactiveException(string message) : base(message) { }
}

public class AccountPendingApprovalException : Exception
{
    public AccountPendingApprovalException(string message) : base(message) { }
}

public class AccountRejectedException : Exception
{
    public AccountRejectedException(string message) : base(message) { }
}

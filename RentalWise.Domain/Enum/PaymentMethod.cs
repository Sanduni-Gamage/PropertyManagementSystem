using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RentalWise.Domain.Enum;

public enum PaymentMethod
{
    BankTransfer,
    CreditCard,
    DebitCard,
    Cash,
    Other
}
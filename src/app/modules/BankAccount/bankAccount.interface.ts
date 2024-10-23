enum AccountType {
  CHECKING = "CHECKING",
  SAVINGS = "SAVINGS",
}

export interface BankAccount {
  id?: number;
  routingNumber: string;
  accountNumber: string;
  accountType: AccountType;

  userEmail: string;
}

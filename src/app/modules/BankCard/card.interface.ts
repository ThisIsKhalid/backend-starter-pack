export interface Card {
  id?: number;
  cardHolderName: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  zipCode: string;
  billingAddress: string;

  userEmail: string;
}

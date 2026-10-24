export type LoanRequest = {
  cpf: string;
  salary: number;
  employerCnpj: string;
  requestedAmount: number;
  installments: number;
};

export type BankStatus = 'APPROVED' | 'REJECTED' | 'UNAVAILABLE';

export type BankResult = {
  bankName: string;
  status: BankStatus;
  interestRate?: number;
  installmentValue?: number;
  totalAmount?: number;
  reason?: string;
};

export interface BankGateway {
  simulate(request: LoanRequest): Promise<BankResult>;
}
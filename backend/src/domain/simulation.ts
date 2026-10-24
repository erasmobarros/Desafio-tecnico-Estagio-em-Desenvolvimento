export interface LoanRequest {
  cpf: string;
  employerCnpj: string;
  name: string;
  email: string;
  salary: number;
  requestedAmount: number;
  installments: number;
}

export interface BankResult {
  bankName: string;
  status: 'APPROVED' | 'REJECTED' | 'UNAVAILABLE';
  interestRate?: number;
  installmentValue?: number;
  totalAmount?: number;
  reason?: string;
}

export interface BankGateway {
  readonly name: string;
  simulate(request: LoanRequest): Promise<BankResult>;
}
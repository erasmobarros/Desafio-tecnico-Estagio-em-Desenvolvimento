import type { BankGateway, BankResult, LoanRequest } from '../domain/simulation.js';

export class BancoBetaGateway implements BankGateway {
  readonly name = 'Banco Beta';

  async simulate(request: LoanRequest): Promise<BankResult> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const interestRate = 0.02;
    const pmt = (request.requestedAmount * interestRate) / (1 - Math.pow(1 + interestRate, -request.installments));

    if (pmt > request.salary * 0.30) {
      return { bankName: this.name, status: 'REJECTED', reason: 'Parcela excede a margem consignável de 30%' };
    }

    return {
      bankName: this.name, status: 'APPROVED', interestRate,
      installmentValue: pmt, totalAmount: pmt * request.installments,
    };
  }
}
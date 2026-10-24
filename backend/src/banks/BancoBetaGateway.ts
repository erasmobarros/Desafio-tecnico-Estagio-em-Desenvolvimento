import type { BankGateway, BankResult } from '../domain/simulation.js';

export class BancoBetaGateway implements BankGateway {
  readonly name = 'Banco Beta';

  async simulate(cpf: string, salary: number, amount: number, installments: number): Promise<BankResult> {
    await new Promise(resolve => setTimeout(resolve, 1200));

    const maxInstallment = salary * 0.3; // Margem consignável de 30%
    const interestRate = 0.02; // 2.0% a.m.
    
    const pmt = (amount * interestRate) / (1 - Math.pow(1 + interestRate, -installments));

    if (pmt > maxInstallment) {
      return { 
        bankName: this.name, 
        status: 'REJECTED', 
        reason: 'Parcela excede a margem consignável de 30%' 
      };
    }

    return {
      bankName: this.name,
      status: 'APPROVED',
      interestRate,
      installmentValue: pmt,
      totalAmount: pmt * installments,
    };
  }
}
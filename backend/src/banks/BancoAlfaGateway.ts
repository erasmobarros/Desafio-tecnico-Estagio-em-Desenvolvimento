import type { BankGateway, BankResult, LoanRequest } from '../domain/simulation.js';

export class BancoAlfaGateway implements BankGateway {
  readonly name = 'Banco Alfa';

  async simulate(request: LoanRequest): Promise<BankResult> {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (request.salary < 1412) {
      return { bankName: this.name, status: 'REJECTED', reason: 'Salário inferior ao mínimo' };
    }

    const interestRate = 0.015; // 1.5% a.m.
    const pmt = (request.requestedAmount * interestRate) / (1 - Math.pow(1 + interestRate, -request.installments));
    
    // Regra da margem de 35%
    if (pmt > request.salary * 0.35) {
      return { bankName: this.name, status: 'REJECTED', reason: 'Parcela excede a margem consignável de 35%' };
    }

    // Se aprovado, devolve TODOS os dados para a tabela aparecer
    return {
      bankName: this.name, 
      status: 'APPROVED', 
      interestRate,
      installmentValue: pmt, 
      totalAmount: pmt * request.installments,
    };
  }
}
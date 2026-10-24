import type { BankGateway, BankResult } from '../domain/simulation.js';

export class BancoAlfaGateway implements BankGateway {
  readonly name = 'Banco Alfa';

  async simulate(cpf: string, salary: number, amount: number, installments: number): Promise<BankResult> {
    // Simula tempo de resposta da API externa
    await new Promise(resolve => setTimeout(resolve, 800));
    // Regras de negócio do Banco Alfa
    if (salary < 1412) {
      return { bankName: this.name, status: 'REJECTED', reason: 'Salário inferior ao mínimo' };
    }

    const interestRate = 0.015; 
    
    // Cálculo financeiro
    const pmt = (amount * interestRate) / (1 - Math.pow(1 + interestRate, -installments));
    const total = pmt * installments;

    return {
      bankName: this.name,
      status: 'APPROVED',
      interestRate,
      installmentValue: pmt,
      totalAmount: total,
    };
  }
}
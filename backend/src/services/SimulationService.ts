import type { BankGateway, BankResult } from '../domain/simulation.js';

export class SimulationService {
  constructor(private gateways: BankGateway[]) {}

  async execute(data: any): Promise<BankResult[]> {
    const timeout = (ms: number, bankName: string): Promise<BankResult> =>
      new Promise(resolve =>
        setTimeout(() => resolve({ bankName, status: 'UNAVAILABLE', reason: 'Timeout na integração' }), ms)
      );

    const promises = this.gateways.map(gateway =>
      Promise.race([
        gateway.simulate(data.cpf, data.salary, data.requestedAmount, data.installments)
          .catch((): BankResult => ({ bankName: gateway.name, status: 'UNAVAILABLE', reason: 'Erro na integração' })),
        timeout(3000, gateway.name)
      ])
    );

    const results = await Promise.allSettled(promises);

    // Tipamos o retorno do map explicitamente como ": BankResult"
    return results.map((result, index): BankResult => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      
      return { 
      
        bankName: this.gateways[index]?.name || 'Banco Desconhecido', 
        status: 'UNAVAILABLE', 
        reason: 'Falha crítica' 
      };
    });
  }
}
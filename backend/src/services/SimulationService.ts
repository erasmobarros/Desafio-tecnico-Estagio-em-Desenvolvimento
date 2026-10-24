import type { BankGateway, BankResult, LoanRequest } from '../domain/simulation.js';

export class SimulationService {
  constructor(private gateways: BankGateway[]) {}

  async execute(request: LoanRequest): Promise<BankResult[]> {
    const promises = this.gateways.map(gateway => {
      return new Promise<BankResult>((resolve) => {
        const timer = setTimeout(() => {
          resolve({ bankName: gateway.name, status: 'UNAVAILABLE', reason: 'Banco indisponível no momento' });
        }, 3000);

        gateway.simulate(request)
          .then(result => resolve(result))
          .catch(() => resolve({ bankName: gateway.name, status: 'UNAVAILABLE', reason: 'Banco indisponível no momento' }))
          .finally(() => clearTimeout(timer));
      });
    });

    return Promise.all(promises);
  }
}
import { describe, it, expect } from 'vitest';
import { SimulationService } from './SimulationService.js';
import type { BankGateway, BankResult } from '../domain/simulation.js';

class MockSuccessGateway implements BankGateway {
  readonly name = 'Banco Sucesso';
  async simulate(): Promise<BankResult> {
    return { bankName: this.name, status: 'APPROVED' };
  }
}

class MockErrorGateway implements BankGateway {
  readonly name = 'Banco Erro';
  async simulate(): Promise<BankResult> {
    throw new Error('Internal Server Error');
  }
}

class MockTimeoutGateway implements BankGateway {
  readonly name = 'Banco Lento';
  async simulate(): Promise<BankResult> {
    return new Promise(resolve => setTimeout(resolve, 5000));
  }
}

describe('SimulationService', () => {
  it('deve retornar UNAVAILABLE para banco que lança erro, mantendo o banco de sucesso', async () => {
    const service = new SimulationService([new MockSuccessGateway(), new MockErrorGateway()]);
    const results = await service.execute({} as any);

    expect(results).toHaveLength(2);
    // Tipagem explícita (r: BankResult) adicionada aqui
    expect(results.find((r: BankResult) => r.bankName === 'Banco Sucesso')?.status).toBe('APPROVED');
    expect(results.find((r: BankResult) => r.bankName === 'Banco Erro')?.status).toBe('UNAVAILABLE');
  });

  it('deve disparar timeout e retornar UNAVAILABLE para banco lento', async () => {
    const service = new SimulationService([new MockTimeoutGateway(), new MockSuccessGateway()]);
    const results = await service.execute({} as any);

    // Tipagem explícita (r: BankResult) adicionada aqui
    expect(results.find((r: BankResult) => r.bankName === 'Banco Lento')?.status).toBe('UNAVAILABLE');
  });
});
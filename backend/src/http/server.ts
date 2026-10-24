import Fastify from 'fastify';
import cors from '@fastify/cors';
import { z } from 'zod';
import { SimulationService } from '../services/SimulationService.js';
import { BancoAlfaGateway } from '../banks/BancoAlfaGateway.js';
import { BancoBetaGateway } from '../banks/BancoBetaGateway.js';

const app = Fastify({ logger: true });

app.register(cors, { origin: '*' });

// Algoritmo real de validação de CPF
const isValidCPF = (cpf: string) => {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0, rest;
  for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  return rest === parseInt(cpf.substring(10, 11));
};
const isValidCNPJ = (cnpj: string) => {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0, pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  size = size + 1; numbers = cnpj.substring(0, size);
  sum = 0; pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

const simulationSchema = z.object({
  name: z.string().min(3, 'O nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string()
    .transform(v => v.replace(/\D/g, ''))
    .refine(isValidCPF, 'CPF inválido'),
  employerCnpj: z.string()
    .transform(v => v.replace(/\D/g, ''))
    .refine(isValidCNPJ, 'CNPJ inválido'),
  salary: z.number().positive('Salário inválido'),
  requestedAmount: z.number().min(100).max(500000, 'Valor máximo permitido é R$ 500.000'),
  installments: z.number().int().min(6).max(96, 'Permitido entre 6 e 96 parcelas'),
});

app.post('/simulations', async (request, reply) => {
  const result = simulationSchema.safeParse(request.body);

  if (!result.success) {
    const zodMessage = result.error.issues[0]?.message || 'Dados de entrada inválidos.';
    return reply.status(400).send({
      message: zodMessage,
      errors: result.error.format(),
    });
  }

  const banks = [new BancoAlfaGateway(), new BancoBetaGateway()];
  const service = new SimulationService(banks);

  const simulationResults = await service.execute(result.data);

  return reply.status(200).send(simulationResults);
});

const start = async () => {
  try {
    await app.listen({ port: 3333, host: '0.0.0.0' });
    console.log('Servidor a rodar em http://localhost:3333');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
# 🏦 Simulador de Empréstimo Consignado (MVP)

MVP desenvolvido para o desafio técnico de Estágio em Desenvolvimento. O cliente preenche uma única vez os dados da proposta e a aplicação consulta, ao mesmo tempo, dois bancos fictícios, mostrando o resultado de cada um: aprovado, reprovado (com o motivo) ou indisponível.

> Todos os dados e bancos são **fictícios**. Nenhuma API real é utilizada.

---

## 📑 Sumário

1. [Stack](#-stack)
2. [Como executar](#-como-executar)
3. [Como usar a API](#-como-usar-a-api)
4. [Estrutura do projeto](#-estrutura-do-projeto)
5. [Decisões técnicas](#-decisões-técnicas)
6. [Limitações](#️-limitações)
7. [Espaço para propor](#-espaço-para-propor)
8. [Uso de IA](#-uso-de-ia)

---

## 💻 Stack

| Camada | Tecnologias |
|---|---|
| Backend | Node.js (v18+), TypeScript, Fastify, Zod, Vitest, tsx |
| Frontend | React, Vite, TypeScript, Axios |

---

## 🚀 Como executar

**Pré-requisitos:** Node.js v18 ou superior e npm.

```bash
git clone https://github.com/erasmobarros/Desafio-tecnico-Estagio-em-Desenvolvimento.git
cd Desafio-tecnico-Estagio-em-Desenvolvimento
```

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

O servidor sobe em **http://localhost:3333**.

Testes unitários e checagem de tipos:

```bash
npm test -- --run
npx tsc --noEmit
```

### 2. Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente **http://localhost:5173**).

Por padrão o frontend chama `http://localhost:3333`. Para apontar para outra URL, crie `frontend/.env` com:

```
VITE_API_URL=http://localhost:3333
```

### Dados para testar

| Campo | Exemplo |
|---|---|
| CPF | `529.982.247-25` |
| CNPJ do empregador | `11.222.333/0001-81` |
| Salário | `5000` |
| Valor desejado | `10000` |
| Parcelas | `24` |

Para ver reprovações, tente salário `1500` com valor `50000` em `12` parcelas (a parcela estoura a margem dos dois bancos).

---

## 🔌 Como usar a API

### `POST /simulations`

```json
{
  "name": "Maria Silva",
  "email": "maria@email.com",
  "cpf": "529.982.247-25",
  "employerCnpj": "11.222.333/0001-81",
  "salary": 5000,
  "requestedAmount": 10000,
  "installments": 24
}
```

CPF e CNPJ podem ser enviados com ou sem máscara.

**Resposta `200`** (um item por banco):

```json
[
  {
    "bankName": "Banco Alfa",
    "status": "APPROVED",
    "interestRate": 0.015,
    "installmentValue": 499.24,
    "totalAmount": 11981.78
  },
  {
    "bankName": "Banco Beta",
    "status": "APPROVED",
    "interestRate": 0.02,
    "installmentValue": 528.71,
    "totalAmount": 12689.06
  }
]
```

`status` pode ser `APPROVED`, `REJECTED` (com `reason`) ou `UNAVAILABLE` (banco não respondeu a tempo ou falhou).

**Resposta `400`** quando a validação falha:

```json
{ "message": "CPF inválido", "errors": { "cpf": { "_errors": ["CPF inválido"] } } }
```

### Regras de validação

| Campo | Regra |
|---|---|
| `name` | mínimo 3 caracteres |
| `email` | formato de e-mail válido |
| `cpf` | 11 dígitos com dígitos verificadores corretos (rejeita sequências repetidas) |
| `employerCnpj` | 14 dígitos com dígitos verificadores corretos |
| `salary` | número positivo |
| `requestedAmount` | entre R$ 100 e R$ 500.000 |
| `installments` | inteiro entre 6 e 96 |

### Regras dos bancos (fictícios)

| | Banco Alfa | Banco Beta |
|---|---|---|
| Taxa | 1,5% ao mês | 2,0% ao mês |
| Margem consignável | parcela até 35% do salário | parcela até 30% do salário |
| Outra regra | salário mínimo de R$ 1.412 | — |
| Latência simulada | 800 ms | 1200 ms |

A parcela é calculada pela **Tabela Price** (parcelas fixas): `PMT = P · i / (1 − (1 + i)^−n)`.

---

## 🗂️ Estrutura do projeto

```
backend/src/
  domain/simulation.ts          # tipos (LoanRequest, BankResult) e contrato BankGateway
  banks/BancoAlfaGateway.ts     # adapter do Banco Alfa
  banks/BancoBetaGateway.ts     # adapter do Banco Beta
  services/SimulationService.ts # orquestra os bancos em paralelo, com timeout
  services/SimulationService.test.ts
  http/server.ts                # rota, validação (Zod) e inicialização

frontend/src/
  App.tsx                       # formulário e exibição dos resultados
```

---

## 🧠 Decisões técnicas

**1. Um contrato, vários bancos (Gateway + Adapter).**
A interface `BankGateway` define o que todo banco precisa fazer: ter um `name` e implementar `simulate(request)`, devolvendo o modelo padronizado `BankResult`. Cada banco tem seu próprio adapter com suas regras. Para incluir um novo banco basta criar outra classe e adicioná-la à lista no `server.ts`; o `SimulationService` e o frontend não mudam.

**2. Consulta em paralelo com timeout individual.**
O `SimulationService` dispara todos os bancos ao mesmo tempo (`Promise.all`), então o tempo de resposta é o do banco mais lento e não a soma. Cada banco tem um timer de 3 segundos. Se o banco lançar erro ou passar do prazo, o resultado dele vira `UNAVAILABLE` e os demais são exibidos normalmente. Como o erro é tratado dentro de cada promise, nenhuma delas rejeita, por isso `Promise.all` é suficiente aqui. O `clearTimeout` evita deixar timers pendentes quando o banco responde.

**3. Validação na borda com Zod.**
Os dados são validados e limpos (remoção de máscara de CPF e CNPJ) antes de chegar ao serviço, incluindo limites de valor e de prazo. Sem esses limites, um valor absurdo gera `Infinity` no cálculo da parcela, que vira `null` no JSON e quebrava a tela do frontend.

**4. Cálculo financeiro correto.**
A parcela usa a Tabela Price. A primeira versão calculava `total / n`, o que não corresponde a parcelas fixas com juros compostos.

**5. Frontend simples e defensivo.**
A tela só exibe taxa, parcela e total quando esses dados existem na resposta, traduz os status para português, formata valores em reais (pt-BR) e destaca a **melhor oferta** (menor parcela entre as aprovadas). Erros da API aparecem com a mensagem exata da validação.

**6. Testes com bancos falsos.**
Os testes usam gateways de mentira (um que lança erro e um que demora mais que o timeout) para provar o comportamento de falha de forma determinística, sem depender de aleatoriedade.

---

## ⚠️ Limitações

- **Timeout não aborta a chamada ao banco:** o prazo protege o cliente, mas a requisição ao banco continua em segundo plano (falta `AbortController`). Com os mocks atuais isso não causa efeito, mas com APIs reais consumiria recursos.
- **Falhas só aparecem nos testes:** no uso normal os dois bancos fictícios sempre respondem. O caminho de `UNAVAILABLE` é demonstrado pelos testes, não pela interface.
- **Sem persistência:** as simulações não são salvas; cada chamada é independente e em memória.
- **Sem autenticação:** não há controle de sessão nem de usuários.
- **CORS aberto (`origin: '*'`):** aceitável para o MVP local, a ser restringido em produção.
- **Dados pessoais chegam aos gateways:** `name` e `email` são repassados junto da requisição, embora os bancos não precisem deles (veja a proposta de minimização de dados).
- **Cobertura de testes:** não há testes de integração da rota HTTP, nem testes unitários dos validadores de CPF e CNPJ, nem testes do frontend.
- **Frontend:** não há máscara nos campos nem validação de CPF e CNPJ no navegador; a validação completa acontece no backend.
- **Duplicidade de cliques:** não há proteção contra várias simulações seguidas (o botão só fica desabilitado durante a requisição).

---

## 💡 Espaço para propor

### ✅ Implementadas

#### 1. Validação estrita na entrada

- **Problema:** dados mal formados ou manipulados passavam sem barreira. CPF e CNPJ só tinham tamanho verificado, e valores absurdos geravam `Infinity` no cálculo da parcela, o que derrubava a tela do cliente.
- **Proposta:** validação dos dígitos verificadores de CPF e CNPJ, remoção das máscaras, limites de valor (R$ 100 a R$ 500.000) e de prazo (6 a 96 parcelas).
- **Por quê:** o cliente recebe uma mensagem clara quando erra um dado, e a empresa não gasta chamadas aos bancos com requisições inválidas.

#### 2. Isolamento de falhas das integrações bancárias

- **Problema:** a empresa depende de APIs de terceiros que ela não controla. Se um banco travar ou falhar, a simulação inteira do cliente poderia ficar presa ou quebrar.
- **Proposta:** consulta paralela com timeout individual de 3 segundos; falha ou lentidão vira `UNAVAILABLE` apenas para aquele banco.
- **Por quê:** o cliente ainda recebe as ofertas dos bancos que responderam, em vez de um erro geral, e a espera nunca ultrapassa o limite definido.

#### 3. Modelo único de resposta (Adapter)

- **Problema:** cada instituição tem regras e formatos próprios, e o resto do sistema não deveria conhecer essas diferenças.
- **Proposta:** cada banco é um adapter que implementa `BankGateway` e devolve sempre o mesmo `BankResult` (status, taxa, parcela, total, motivo).
- **Por quê:** a interface exibe todos os bancos do mesmo jeito, e adicionar um terceiro banco não exige mexer no serviço nem na tela.

#### 4. Resultado compreensível para o cliente

- **Problema:** o cliente não quer só uma lista de respostas: quer entender qual banco é melhor e por que alguém reprovou.
- **Proposta:** a tela destaca a melhor oferta, mostra o motivo de cada reprovação, traduz os status e formata os valores em reais.
- **Por quê:** reduz a dúvida na hora de decidir e deixa claro o que fazer em seguida (por exemplo, diminuir o valor quando a margem estoura).

### 🗓️ Planejadas (por ordem de prioridade)

#### Prioridade 1: Minimização de dados e prevenção de vazamento em logs

- **Problema:** `name` e `email` são repassados aos gateways sem necessidade, e, se um logger centralizado for adicionado, CPF e salário podem ser registrados em texto puro.
- **Proposta:** enviar a cada banco apenas os campos de que ele precisa e configurar `redact` no Pino/Fastify para mascarar CPF, e-mail e salário em qualquer log de requisição.
- **Por quê:** reduz o risco com a LGPD e limita o impacto caso um terceiro ou um log seja exposto. É barato de fazer e deve vir primeiro.

#### Prioridade 2: Resultados em tempo real (SSE)

- **Problema:** o cliente espera a resposta do banco mais lento (cerca de 1,2 s aqui, mais com bancos reais) olhando uma tela parada.
- **Proposta:** devolver um identificador da simulação e transmitir cada resultado via Server-Sent Events assim que o banco responde; em uma segunda etapa, usar fila (por exemplo, Redis + BullMQ) para desacoplar do HTTP.
- **Por quê:** o cliente vê a primeira oferta em segundos, o que reduz o abandono do fluxo.

#### Prioridade 3: Circuit breaker e cancelamento real das chamadas

- **Problema:** se um banco está fora do ar, cada simulação continua esperando 3 segundos por ele, e a chamada abandonada segue ocupando recursos.
- **Proposta:** circuit breaker por banco (por exemplo, com `opossum`) que interrompe temporariamente as chamadas após muitas falhas, e `AbortController` para cancelar a requisição no timeout.
- **Por quê:** economiza recursos, evita a fila de timeouts e deixa o sistema se recuperar sozinho quando o banco volta.

#### Prioridade 4: Cache curto e limite de requisições

- **Problema:** cliques repetidos no botão geram chamadas idênticas aos bancos, com custo e risco de abuso.
- **Proposta:** cache de 5 minutos por combinação de CPF, valor e prazo, e rate limiting por IP.
- **Por quê:** respostas instantâneas para pedidos repetidos e proteção da infraestrutura e das APIs dos parceiros.

#### Prioridade 5: Qualidade e observabilidade

- **Problema:** hoje só o serviço tem testes, e não é possível saber qual banco está falhando ou lento.
- **Proposta:** testes unitários dos validadores, testes de integração da rota e métricas por banco (taxa de erro e latência).
- **Por quê:** permite alterar o código com segurança e detectar problemas de uma integração antes que o cliente reclame.

---

## 🤖 Uso de IA

Utilizei ferramentas de IA como apoio durante o desenvolvimento e revisão. Li, testei e compreendo todo o código entregue e consigo explicar cada decisão técnica descrita acima.
# 🏦 Simulador de Empréstimo Consignado (MVP)

MVP desenvolvido para o desafio técnico de Estágio em Desenvolvimento. O objetivo da aplicação é permitir que o cliente solicite uma simulação de empréstimo consignado e consulte a avaliação de diferentes instituições bancárias simuladas em tempo real.

---

## 💻 Stack Tecnológica

- **Backend:**
  - **Node.js** & **TypeScript**
  - **Fastify** (Framework web leve e de alta performance)
  - **Zod** (Validação e parsing estrito de dados)
  - **Vitest** (Suíte de testes unitários rápidos)

- **Frontend:**
  - **React** & **Vite**
  - **TypeScript**
  - **Axios** (Cliente HTTP para integração com a API)

---

## 📐 Arquitetura e Decisões Técnicas

A solução foi estruturada aplicando os princípios de **Clean Architecture** e **Ports & Adapters (Arquitetura Hexagonal)**, focando em resiliência e facilidade de extensão:

1. **Padrão Gateway / Adapter (`BankGateway`):**
   - Foi criada a interface `BankGateway` no domínio para definir o contrato único de comunicação com qualquer banco.
   - Cada banco possui o seu próprio Adapter (`BancoAlfaGateway`, `BancoBetaGateway`), isolando regras internas, formatos de resposta e particularidades de cada instituição.

2. **Orquestração Resiliente (`Promise.allSettled`):**
   - As simulações são disparadas em paralelo.
   - Utilizou-se `Promise.allSettled` com um mecanismo de *timeout* individual (3 segundos por banco). Caso uma instituição falhe, demore a responder ou lance uma exceção, o sistema captura a falha, marca o banco como `UNAVAILABLE` e exibe normalmente os resultados das instituições que responderam com sucesso.

3. **Validação de Dados:**
   - Uso da biblioteca **Zod** no backend para garantir a integridade de campos obrigatórios (CPF, Salário, CNPJ do Empregador, Valor Solicitado e Parcelas).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **npm**

### 1. Clonar o Repositório
```bash
git clone [https://github.com/erasmobarros/Desafio-tecnico-Estagio-em-Desenvolvimento.git](https://github.com/erasmobarros/Desafio-tecnico-Estagio-em-Desenvolvimento.git)
cd Desafio-tecnico-Estagio-em-Desenvolvimento

2. Executar o Backend
Bash
cd backend
npm install
npm run dev
O servidor backend estará a rodar no endereço http://localhost:3333.

Para executar a suíte de testes unitários:

Bash
npm test
3. Executar o Frontend
Em uma nova aba ou janela do terminal:

Bash
cd ../frontend
npm install
npm run dev
Aceda à interface web no endereço indicado pelo Vite (normalmente http://localhost:5173).
```

---

### ⚠️ Limitações da Solução Atual
Simulação em Memória: Não há integração com base de dados para persistência do histórico de simulações.

Mocks Locais: As chamadas para os bancos utilizam dados e regras simuladas localmente com latências fictícias.

Sem Autenticação: A aplicação não possui controlo de sessão ou gestão de utilizadores.

---

## 💡 Espaço para Propor

### 🛠️ Propostas Implementadas
1. Resiliência e Isolamento de Falhas nas Integrações Bancárias
Problema: A empresa depende de APIs bancárias de terceiros sobre as quais não possui controlo. Instabilidades ou indisponibilidades em um banco parceiro poderiam travar toda a simulação do cliente.

Proposta: Implementação do padrão Adapter associado ao consumo em paralelo via Promise.allSettled e limite de tempo (timeout) individual por requisição.

Por quê: Garante que a operação continue funcional e que o cliente receba os resultados parciais dos bancos disponíveis, impedindo que o sistema falhe por completo devido a um erro externo.

2. Normalização de Respostas Heterogéneas
Problema: Cada instituição financeira retorna dados em estruturas, tipos de taxa e formatos de status totalmente distintos.

Proposta: Mapeamento e conversão de dados dentro de cada Gateway para um modelo de resposta padronizado no domínio (BankResult).

Por quê: Simplifica o consumo e a renderização na interface do utilizador, além de permitir a adição de novos bancos com impacto zero no restante da aplicação.

### 📋 Propostas Planejadas (por ordem de prioridade)

## Prioridade 1: Processamento Assíncrono e Server-Sent Events (SSE)
Problema: O cliente precisa de aguardar em uma tela estática até que todas as chamadas bancárias sejam concluídas.

Proposta: Arquitetura assíncrona baseada em filas de mensagens (ex: Redis + BullMQ) com streaming de resultados para o frontend via Server-Sent Events (SSE).

Por quê: Permite exibir a oferta de cada banco no ecrã no exato momento em que ela é processada, reduzindo a perceção do tempo de espera e aumentando a taxa de conversão do produto.

## Prioridade 2: Cache de Cotações e Rate Limiting
Problema: Clientes que clicam repetidamente no botão "Simular" geram custos desnecessários de infraestrutura e chamadas repetidas a APIs externas.

Proposta: Implementar uma camada de cache temporário (TTL de 5 minutos) indexada pelo hash da simulação (CPF + Valor + Parcelas) e aplicar limitação de taxa (Rate Limiting) por IP/CPF.

Por quê: Protege a infraestrutura contra abusos, economiza recursos operacionais e entrega respostas instantâneas para requisições duplicadas.

## Prioridade 3: Circuit Breaker por Instituição Financeira
Problema: Continuar a enviar chamadas para uma API bancária que está comprovadamente fora do ar gera desperdício de recursos e acúmulo de timeouts.

Proposta: Implementar o padrão Circuit Breaker (ex: com a biblioteca opossum) para interromper temporariamente requisições a bancos com alta taxa de erro.

Por quê: Evita a degradação da performance geral do sistema e permite a recuperação automática das integrações sem intervenção manual.

## Prioridade 4: Sanitização de Logs e Conformidade com a LGPD
Problema: O registo de logs contendo dados pessoais sensíveis (CPF, salário, e-mail) em texto puro pode gerar passivos jurídicos e violações de privacidade.

Proposta: Criar um middleware de logging que aplica mascaramento automático de dados sensíveis (***.456.789-**) antes da persistência de qualquer registo de auditoria.

Por quê: Garante a conformidade contínua com a LGPD e amplia a segurança da informação na infraestrutura da empresa.
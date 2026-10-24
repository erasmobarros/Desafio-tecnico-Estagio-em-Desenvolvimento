Markdown
# 🏦 Simulador de Empréstimo Consignado

## 💻 Stack Tecnológica
- **Backend:** Node.js, TypeScript, Fastify, Zod, Vitest.
- **Frontend:** React, Vite, Axios.

## 📐 Arquitetura
A solução utiliza o **Padrão Adapter / Gateway** para encapsular e padronizar a comunicação com entidades externas (Bancos). As chamadas de simulação são executadas concorrentemente (`Promise.all`), com controle de timeout individual para assegurar que a lentidão de uma API não afete a experiência global, garantindo alta resiliência (Fail-Safe).

## 🚀 Como Executar

### 1. Backend
Execute numa janela de terminal:
```bash
cd backend
npm install
npm run dev
(Para testes unitários execute npm test -- --run)

2. Frontend
Execute noutra janela de terminal:

Bash
cd frontend
npm install
npm run dev

```

### ⚠️ Limitações Atuais
Timeout Não Abortivo (Falta de AbortController): O timeout da promessa protege o cliente final, mas a requisição TCP subjacente ao banco não é interrompida, mantendo processamento em segundo plano.

Armazenamento: Simulação Stateless em memória, sem persistência em base de dados.

Segurança de Origem: CORS aberto (origin: '*') para viabilizar testes locais no MVP.

Testes de Integração: Rota HTTP ainda não possui cobertura de testes de integração ponta-a-ponta (E2E).

### 💡 Espaço para Propor
## 🛠️ Propostas Já Implementadas
1. Zod com Validação Estrita (CPF/CNPJ e Tabela Price)

Problema: Inputs manipulados ou mal formados causam "tela branca" no frontend e quebram a Tabela Price com valores tendendo ao infinito.

Proposta: Sanitização (remoção de máscaras) e validação matemática de dígitos verificadores para CPF/CNPJ, acompanhada de imposição de limites máximos (R$ 500.000).

Por quê: Blinda a API de bad payloads e reduz o custo operacional com chamadas inúteis aos bancos.

2. Timeout Global Resiliente

Problema: Uma falha ou latência severa num banco específico derruba a requisição inteira.

Proposta: Utilização de concorrência com timers (clearTimeout) que devolvem o status Indisponível se o banco não responder em 3 segundos.

Por quê: Otimiza a taxa de conversão ao garantir que ofertas válidas cheguem ao ecrã do cliente mesmo com integrações terceiras degradadas.

📋 Próximas Evoluções (Backlog)
Prioridade 1: Prevenção de Vazamento de PII em Logs

Problema: Na eventual implementação de um Logger centralizado para observabilidade, dados sensíveis (CPF, Salário) podem ser escritos em texto puro.

Proposta: Implementar redatores (redact) na configuração do Fastify/Pino para mascarar dados de request.body.

Por quê: Adequação estrita às normas de privacidade e mitigação de danos em caso de exposição de logs.

Prioridade 2: Processamento Assíncrono (Webhooks ou SSE)

Problema: O bloqueio HTTP síncrono força o cliente a esperar pela resposta mais lenta dentre os gateways disponíveis.

Proposta: Alterar a interface para um modelo Assíncrono (Server-Sent Events) onde as propostas bancárias vão surgindo na UI em tempo real assim que processadas.

Por quê: Transforma o tempo de espera numa experiência interativa, diminuindo o abandono de fluxo (Drop-off).
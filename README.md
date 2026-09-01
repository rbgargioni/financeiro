# Fluxa — Sistema Financeiro Multi-Empresa (SaaS)

Sistema de gestão financeira (contas a pagar/receber, fluxo de caixa, estoque) para venda a
múltiplas empresas, no estilo do módulo Financeiro da [Evolutivo ERP](https://evolutivosistema.com.br/).

Multi-tenant: um super-admin da plataforma gerencia várias empresas-cliente, cada uma com
login e dados isolados, plano de assinatura e **7 dias de teste grátis**.

Banco de dados: **Firebase** (Firestore + Authentication), projeto `fluxa-financeiro-f8b2d`.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Precisa de um `.env.local` com as chaves `NEXT_PUBLIC_FIREBASE_*`
(veja `src/lib/firebase.ts`) — não versionado, pegue com o administrador do projeto.

### Contas de demonstração (empresas-cliente)

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Empresa em teste grátis | `contato@paonosso.com.br` | `senha123` |
| Empresa com assinatura ativa | `financeiro@rotacerta.com.br` | `senha123` |
| Empresa com teste expirado | `contato@boavista.com.br` | `senha123` |

O login de super-admin da plataforma não é público — só o administrador da conta Firebase tem
acesso a ele.

### Popular dados de demonstração

```bash
npm run seed
```

Requer `serviceAccountKey.json` na raiz do projeto (gitignored — gerado em Firebase Console →
Configurações do projeto → Contas de serviço). Cria as empresas, usuários e lançamentos de
exemplo listados em `src/lib/mock-data`.

## Build estático (GitHub Pages)

O projeto usa `output: "export"` (`next.config.ts`) porque é publicado como site estático no
GitHub Pages — não há servidor, então a proteção de rotas (login, trial) acontece no
navegador (`src/components/auth`), não em middleware.

```bash
npm run build
```

Gera a pasta `out/`. O workflow `.github/workflows/deploy.yml` builda e publica essa pasta
automaticamente no GitHub Pages a cada push na branch `main`, injetando as variáveis
`NEXT_PUBLIC_FIREBASE_*` a partir de Secrets do repositório (Settings → Secrets and variables →
Actions).

Site: `https://rbgargioni.github.io/financeiro/`.

## Módulos

- **Financeiro**: contas a pagar/receber, fluxo de caixa, categorias, clientes e fornecedores
- **Estoque**: produtos e movimentações de entrada/saída, com alerta de estoque baixo
- **Importar Extrato**: leitura de extrato bancário `.ofx`, com conferência antes de salvar
- **Exportação**: Excel e PDF em todas as telas de listagem
- **Admin**: painel do super-admin para gerenciar empresas-cliente e assinaturas

## Estrutura

- `src/app` — rotas (landing, login/signup, `/dashboard/*` da empresa, `/admin/*` da plataforma)
- `src/lib/mock-data` — dados de exemplo usados pelo `npm run seed`
- `src/lib/data` — camada de acesso ao Firestore (funções assíncronas, sempre filtradas por
  `companyId`)
- `src/lib/firebase.ts` — inicialização do Firebase (Auth + Firestore)
- `src/contexts/AuthContext.tsx` — sessão via Firebase Authentication
- `src/components/auth` — guards client-side que substituem o middleware de servidor
- `firestore.rules` — regras de segurança (isolamento por empresa)
- `scripts/seed.ts` — popula Firestore/Auth com os dados de `src/lib/mock-data`

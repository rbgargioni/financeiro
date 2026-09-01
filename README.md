# Fluxa — Sistema Financeiro Multi-Empresa (SaaS)

Sistema de gestão financeira (contas a pagar/receber, fluxo de caixa) para venda a múltiplas
empresas, no estilo do módulo Financeiro da [Evolutivo ERP](https://evolutivosistema.com.br/).

Multi-tenant: um super-admin da plataforma gerencia várias empresas-cliente, cada uma com
login e dados isolados, plano de assinatura e **7 dias de teste grátis**.

> **Status atual:** todos os dados são fictícios (`src/lib/mock-data`), guardados no
> `localStorage` do navegador. O banco de dados final será o Firebase, mas ainda não está
> conectado — veja `src/lib/firebase.ts` para o que falta fazer quando isso acontecer.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

### Contas de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Super admin da plataforma | `admin@plataforma.com` | `senha123` |
| Empresa em teste grátis | `contato@paonosso.com.br` | `senha123` |
| Empresa com assinatura ativa | `financeiro@rotacerta.com.br` | `senha123` |
| Empresa com teste expirado | `contato@boavista.com.br` | `senha123` |

## Build estático (GitHub Pages)

O projeto usa `output: "export"` (`next.config.ts`) porque é publicado como site estático no
GitHub Pages — não há servidor, então a proteção de rotas (login, trial) acontece no
navegador (`src/components/auth`), não em middleware.

```bash
npm run build
```

Gera a pasta `out/`. O workflow `.github/workflows/deploy.yml` builda e publica essa pasta
automaticamente no GitHub Pages a cada push na branch `main`.

Para habilitar: no GitHub, em **Settings → Pages**, defina "Source" como **GitHub Actions**.
O site fica em `https://<usuario>.github.io/financeiro/`.

## Estrutura

- `src/app` — rotas (landing, login/signup, `/dashboard/*` da empresa, `/admin/*` da plataforma)
- `src/lib/mock-data` — dados fictícios (empresas, usuários, lançamentos, categorias, contatos)
- `src/lib/data` — camada de acesso a dados (funções assíncronas, filtradas por empresa) —
  ponto de troca futuro para Firestore
- `src/contexts/AuthContext.tsx` — sessão mock (login, empresa atual)
- `src/components/auth` — guards client-side que substituem o middleware de servidor

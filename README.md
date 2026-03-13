# EmpatIA — Saúde Mental do Professor

Plataforma digital de apoio à saúde mental de professores, baseada em jornadas conversacionais guiadas por IA (Claude/Anthropic).

## Stack Tecnológica

- **Frontend**: Next.js 15 + React 19 + Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: SQLite + Prisma ORM
- **IA**: Claude API (Anthropic) com tons configuráveis
- **Gráficos**: Recharts
- **Auth**: JWT (jose) + bcrypt

## Setup Rápido

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` e coloque sua chave da API Claude:
```
ANTHROPIC_API_KEY=sk-ant-api03-SUA-CHAVE-AQUI
JWT_SECRET=uma-chave-secreta-qualquer-de-32-chars
```

### 3. Configurar banco de dados

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Adicionar logos

Coloque os arquivos na pasta `public/logos/`:
- `logo-icone.png` — Logo ícone (mãos + cérebro/coração)
- `logo-texto.png` — Logo com texto "EmpatIA"
- `logo-completo.png` — Logo completo (ícone + texto)

### 5. Rodar o projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

### Credenciais de teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@escola.com | admin123 |
| Professor | professor@escola.com | prof123 |

## Estrutura do Projeto

```
empatia/
├── prisma/
│   ├── schema.prisma          # Schema do banco de dados
│   └── seed.ts                # Dados iniciais + configs da IA
├── public/
│   └── logos/
│       ├── logo-icone.png     # Ícone (mãos + cérebro)
│       ├── logo-texto.png     # Texto "EmpatIA"
│       └── logo-completo.png  # Ícone + texto
├── src/
│   ├── app/
│   │   ├── page.tsx           # Login
│   │   ├── professor/
│   │   │   ├── page.tsx       # Home (boas-vindas + escolha)
│   │   │   ├── jornada/
│   │   │   │   └── page.tsx   # Chat conversacional com IA
│   │   │   └── diagnostico/
│   │   │       └── page.tsx   # Resultado do diagnóstico
│   │   ├── admin/
│   │   │   ├── page.tsx       # Dashboard com gráficos
│   │   │   └── professores/
│   │   │       └── page.tsx   # Lista de professores
│   │   └── api/
│   │       ├── auth/route.ts       # Login/registro
│   │       ├── chat/route.ts       # Chat com IA
│   │       ├── jornada/route.ts    # CRUD de jornadas
│   │       ├── dashboard/route.ts  # Dados do dashboard
│   │       └── professores/route.ts # Lista de profs (admin)
│   ├── config/
│   │   └── perguntas.ts       # Banco de perguntas das jornadas
│   ├── lib/
│   │   ├── auth.ts            # Autenticação JWT
│   │   ├── claude.ts          # Integração Claude API
│   │   ├── db.ts              # Prisma client
│   │   └── scoring.ts         # Cálculos IRPE, IBED, estresse
│   └── types/
│       └── index.ts           # Tipos TypeScript
├── .env.example
├── package.json
└── README.md
```

## Onde os logos são usados

| Arquivo | Logo usado | Contexto |
|---------|-----------|----------|
| `layout.tsx` | `logo-icone.png` | Favicon da aba |
| `page.tsx` (login desktop) | `logo-icone.png` | Header do painel esquerdo |
| `page.tsx` (login mobile) | `logo-completo.png` | Topo da tela de login |
| `professor/page.tsx` | `logo-icone.png` | Avatar na tela de boas-vindas |
| `professor/jornada/page.tsx` | — | Pode adicionar no header do chat |
| `admin/page.tsx` | — | Pode adicionar no header do dashboard |

## IA Configurável

Os prompts da IA ficam no banco de dados (tabela `ConfiguracaoIA`) e podem ser editados sem mexer no código:

| Nome | Descrição |
|------|-----------|
| `marcia_acolhimento` | Tom de boas-vindas |
| `marcia_jornada_trabalho` | Perguntas sobre trabalho |
| `marcia_jornada_relacionamentos` | Perguntas sobre relações |
| `marcia_jornada_financas` | Perguntas sobre finanças |
| `marcia_diagnostico` | Entrega do diagnóstico |
| `marcia_suporte` | Conversa aberta de suporte |

## Indicadores

- **IRPE** — Índice de Risco Psicossocial Escolar (0-1)
- **IBED** — Índice de Bem-Estar Docente (evolução emocional)
- **Estresse ocupacional** — pontuação 0-20
- **Burnout relacional** — classificação de risco

## Próximos Passos

- [ ] Tela de cadastro de novas escolas
- [ ] Editor de prompts da IA no admin
- [ ] Relatórios em PDF gerados por IA
- [ ] Comparação temporal (evolução mensal)
- [ ] Notificações e lembretes
- [ ] PWA / app mobile
- [ ] Integração com sistemas escolares

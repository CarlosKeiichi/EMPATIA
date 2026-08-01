# Código de instituição — abertura da plataforma para a Descomplica

**Data:** 2026-08-01
**Status:** aprovado, em implementação

## Problema

Hoje `/cadastro` é aberto: qualquer pessoa cria conta e passa a alimentar dados.
O professor nasce sem `escolaId`, então todas as jornadas caem num balaio único que
só o superadmin enxerga. Não há como abrir a plataforma para uma instituição
cliente e entregar a ela as métricas do próprio corpo docente.

A primeira instituição é a **Descomplica**.

## O que já existe

- `Escola` (`prisma/schema.prisma:59`) com `professores[]` e `admins[]`
- `GET /api/dashboard` (`src/app/api/dashboard/route.ts:28`) já resolve `escolaId`
  a partir do admin logado e já filtra todas as métricas por ele
- `registroSchema` (`src/lib/validations.ts:19`) já aceita `escolaId`

O que falta é o código de entrada e o vínculo no cadastro — a tela nunca envia
`escolaId`.

## Decisões

| Decisão | Escolha |
|---|---|
| Modelagem | Instituição = uma linha em `Escola`. Sem hierarquia acima. |
| Regra de entrada | Código **obrigatório** para todo cadastro. |
| Gestão | Tela no admin, superadmin cria e administra. |
| Dados atuais | Professores sem instituição ficam como estão. |
| Onde o código mora | Campo `codigo` na própria `Escola`, um por instituição. |

Descartado: model `Instituicao` acima de `Escola` (não há sub-unidades hoje);
tabela `CodigoConvite` com validade e limite de vagas (features de contrato, sem
caso de uso na primeira instituição — migrar depois é barato); link mágico sem
código digitável (quebra o boca a boca na sala dos professores).

## 1. Dados

```prisma
model Escola {
  id     String  @id @default(cuid())
  nome   String
  codigo String? @unique   // NOVO
  ativa  Boolean @default(true)
  ...
}
```

**Nullable no banco, obrigatório na aplicação.** O projeto usa `prisma db push`
(não há `prisma/migrations`). Adicionar coluna `NOT NULL UNIQUE` numa tabela com
linhas existentes falha ou exige reset do `dev.db`. O cadastro e a tela de
criação exigem o código; o banco tolera nulo para não quebrar a migração.

**Comparação case-insensitive na mão.** O Prisma não suporta
`mode: 'insensitive'` no SQLite. Grava sempre em maiúscula; compara
`codigo.trim().toUpperCase()`.

**Formato:** `DESCOMPLICA-7K2M` — nome normalizado + 4 caracteres aleatórios.
Falável no telefone, colável no WhatsApp, não adivinhável. Um código puro
`DESCOMPLICA` seria chutado por qualquer um, e estranhos entrariam no pool de
métricas da instituição.

## 2. Cadastro

O código é o **primeiro campo** do passo 1, antes do nome — é o portão.

- `/cadastro?codigo=DESCOMPLICA-7K2M` pré-preenche o campo (link distribuído)
- Ao sair do campo, `GET /api/instituicoes/validar?codigo=X` →
  `{ valida, nome }`; a tela mostra **✓ Descomplica**, confirmando a instituição
  antes da pessoa digitar mais nada
- Rota pública — entra no `PUBLIC_ROUTES` de `src/middleware.ts:6`
- No submit, `POST /api/auth` recebe `codigo` e **revalida no servidor**,
  resolvendo o `escolaId`. O client nunca envia `escolaId`: seria forjável pelo
  DevTools.
- `registroSchema` troca `escolaId` opcional por `codigo` obrigatório

## 3. Tela `/admin/instituicoes` (superadmin)

Lista: nome, código, professores vinculados, jornadas concluídas, ativa.
Ações: criar (nome + código auto-sugerido a partir do nome, editável),
renomear, ativar/desativar, copiar link de convite.

Desativar bloqueia **novos cadastros**. Não esconde métricas nem derruba quem
já entrou.

Arquivos: `src/app/admin/instituicoes/page.tsx`,
`src/app/api/admin/instituicoes/route.ts` (GET/POST),
`src/app/api/admin/instituicoes/[id]/route.ts` (PATCH),
item no nav de `src/components/AdminLayout.tsx:9`.

## 4. Dashboard

Quase nada a fazer — o escopo por `escolaId` já funciona. Um admin da
Descomplica é um `Admin` com `escolaId` apontando para ela.

Adição: seletor de instituição no topo do dashboard **para o superadmin**, que
hoje só troca de escola editando `?escolaId=` na URL.

## 5. Erros

| Situação | Resposta |
|---|---|
| Código não existe | "Código não encontrado. Confira com a sua instituição." |
| Instituição inativa | "Este código não está mais ativo." |
| Código vazio | Bloqueia o avanço do passo 1 |
| Código apagado entre validar e enviar | Erro no submit, cadastro não acontece |
| Código duplicado ao criar | 409 na tela do admin |

O endpoint de validação é um oráculo de códigos, varrível por força bruta. O
sufixo aleatório é a defesa principal. Rate limit fica para depois: o dano de um
cadastro indevido é métrica suja, não vazamento de dado.

## 6. Verificação

O projeto **não tem framework de teste** — `devDependencies` traz apenas prisma,
tsx, tailwind e typescript. Instalar um runner está fora do escopo desta
entrega. A verificação é manual, de ponta a ponta, no app rodando:

1. Cadastro com o código da Descomplica → professor vinculado ao `escolaId` certo
2. Código inexistente e código de instituição inativa → cadastro recusado
3. Código em minúsculas e com espaços → aceito
4. Criação de código duplicado no admin → 409
5. Dashboard de duas instituições → nenhum dado vaza de uma para a outra
6. `escolaId` forjado no corpo do registro → ignorado, vale o código
7. Admin comum forjando `?escolaId=` no dashboard → ignorado

O item 5 é o que mais importa: é a promessa que a plataforma faz ao cliente.

**Executado em 2026-08-01, todos passando.** Os itens 6 e 7 são regressões que
não estavam no design original: o 7 era um furo pré-existente em
`src/app/api/dashboard/route.ts`, onde um admin sem escola vinculada lia as
métricas de qualquer instituição trocando a URL.

## Nota de ambiente — iCloud

O projeto está em `~/Desktop/Projetos/empatia`, e o Desktop está sincronizado
com o iCloud (`~/Library/Mobile Documents/com~apple~CloudDocs/Desktop` é um
symlink para ele). Cada leitura em `node_modules` passava pelo `fileproviderd`:
ler o engine de 21 MB do Prisma levava **13,4 s** (~1,6 MB/s). O `next dev`
ficava inutilizável — 700 s até `Ready`, 672 s para compilar `/`, e o cache do
webpack falhando com `ENOENT` no rename a cada tentativa.

**Solução aplicada:** atributo estendido de exclusão, aplicado no lugar:

```bash
xattr -w 'com.apple.fileprovider.ignore#P' 1 node_modules
xattr -w 'com.apple.fileprovider.ignore#P' 1 .next
```

Resultado: `Ready` em **1,1 s**, `/` em 1,6 s, `tsc --noEmit` em 3 s (era 112 s).

**Não use `.nosync`.** A abordagem óbvia — renomear para `node_modules.nosync`
e deixar um symlink — **quebra o build**. O Next exclui dependências dos
loaders com o padrão `/node_modules/`, e o caminho real vira
`node_modules.nosync/`, que não casa. O webpack passa a processar arquivos de
pacote que nunca deveria tocar e morre com `ModuleParseError` tentando parsear
o README do `@libsql/client`. Isso derruba todas as rotas de API, inclusive as
que já existiam. O atributo estendido preserva o nome do diretório e não tem
esse efeito.

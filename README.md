<div align="center">
  <img src="frontend/public/logo.jpg" alt="Caixa de Repertório" width="160" style="border-radius: 24px;" />
</div>

<br />

# Caixa de Repertório

> **Seu repertório musical na ponta dos dedos, sem perder nenhum tom.**

Caixa de Repertório (GigManager) é uma plataforma completa e moderna para músicos, diretores musicais, bandas e cantores gerenciarem seu acervo completo de canções, níveis de domínio técnico (1 a 5), intersecções de tons por artista, montagem dinâmica de setlists por blocos, exportação profissional de acervo em PDF e envio instantâneo de escalas no WhatsApp via Evolution API.

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/jorgesoares2997/caixa_de_repertorio)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Backend-Spring%20Boot%203-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Neon Postgres](https://img.shields.io/badge/Database-Neon%20Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Evolution API](https://img.shields.io/badge/WhatsApp-Evolution%20API-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/EvolutionAPI/evolution-api)

---

## 🎯 Problem Statement

Músicos profissionais e bandas enfrentam desorganização constante ao lidar com múltiplos projetos, formações e cantores diferentes:
* **Tons divergentes:** A mesma música é tocada em *Fá* com um cantor e em *Lá* com outro.
* **Falta de controle de estudo:** Dificuldade de saber quais músicas estão 100% memorizadas e quais precisam de revisão antes do show.
* **Comunicação truncada:** Ter que digitar manualmente setlists no WhatsApp minutos antes de subir ao palco.
* **Perda de repertório:** Cadernos e blocos de notas dispersos sem backup unificado.

O **Caixa de Repertório** resolve esse problema unificando todo o ciclo musical em uma interface neo-brutalista de altíssima performance, com cache instantâneo e automações de palco.

---

## ✨ Principais Funcionalidades

### 🎼 1. Acervo Central & Gestão de Domínio (CRUD Completo)
- **Catálogo Unificado:** Mais de 240+ obras cadastradas com título, compositor, gênero musical, tom original, andamento (BPM) e notas de arranjo/cifra.
- **Níveis de Domínio Visual (1 a 5):**
  - `1`: Aprendendo / Estrutura básica
  - `2`: Em ensaio / Decorando
  - `3`: Toca com cifra / Seguro
  - `4`: Muito seguro / De cor
  - `5`: 100% Dominado / Pronto para palco
- **Busca Global & Filtros Dinâmicos:** Filtre por gêneros (*MPB, Bossa Nova, Samba, Jazz Standards, Pop, Soul, Forró*) e busque instantaneamente com o atalho `/`.

### 👥 2. Artistas, Projetos & Matriz de Tons (Intersecções)
- Visualize repertórios exclusivos por projeto ou cantor (ex: *Luiza Salles, Sophia, Geral*).
- **Matriz de Intersecção:** Identifique rapidamente em quais tons cada artista canta a mesma música para nunca errar a harmonia.
- **Exportação Segmentada:** Gere PDFs organizados por compositor ou gênero musical para cada cantor com 1 clique.

### 🎪 3. Construtor de Shows & Setlists por Blocos
- Arraste e adicione músicas do acervo diretamente para blocos de show (*Bloco 1, Bloco 2, Bis*).
- Ajuste e memorize tons específicos de execução diretamente na grade do show.
- Reordenação e cálculo dinâmico de faixas.

### 📲 4. Disparo de Escalas no WhatsApp (Evolution API)
- Envio instantâneo da escala formatada direto para o WhatsApp do grupo ou músico com 1 clique.
- Inclui data, local, ordem das faixas, blocos e tons de cada música em negrito e emojis elegantes.

### 📄 5. Motor de PDF Profissional (iText 7)
- Geração de relatórios tipográficos de alta fidelidade para impressão ou leitura em tablet na estante.
- Inclui paginação dinâmica, cabeçalhos, rodapés com data/hora e divisão limpa por artista e gênero.

### ⚡ 6. Cache Offline & Instantâneo com Zustand
- Persistência no `localStorage` com carregamento em **0ms** (zero tela branca).
- Atualizações otimistas para notas, novos cadastros e avaliações de domínio.

---

## 🏗️ Arquitetura do Sistema

```
┌──────────────────────────────────────────────────────────┐
│  Next.js 16 (Turbopack) + Tailwind CSS v4               │
│  Zustand (LocalStorage Cache) · TanStack Table v8       │
│  Framer Motion · Lucide React · Neo-Brutalist UI        │
└────────────────────────┬─────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────▼─────────────────────────────────┐
│  Spring Boot 3 + Java 17/21 (Maven)                      │
│  Spring Data JPA · Hibernate · Transactional Services   │
│  iText 7 Core Engine (PDFs) · Spring Mail (SMTP)         │
└────────────────────────┬─────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼─────────────────┐   ┌─────────▼────────────────┐
│  Neon Serverless Postgres│   │  Evolution API Gateway   │
│  Flyway Schema History   │   │  WhatsApp Webhook & Send │
│  Branching & Pooling     │   │  Multi-Device Baileys    │
└──────────────────────────┘   └──────────────────────────┘
```

---

## 🛠️ Tech Stack

| Camada | Tecnologia | Detalhes |
|---|---|---|
| **Frontend** | Next.js 16 · React 19 · TypeScript | App Router, Turbopack, Server/Client components |
| **Estilização** | Tailwind CSS v4 | Design Neo-Brutalista com paleta de alto contraste |
| **State & Cache** | Zustand 5 | Persistência local (`localStorage`), atualizações otimistas |
| **Tabelas & Filtros** | TanStack React Table v8 | Paginação, ordenação multi-coluna e busca global |
| **Animações & Ícones** | Framer Motion · Lucide React | Micro-interações táteis e feedback visual |
| **Backend** | Spring Boot 3 · Java 17 | REST Controllers, DTOs, JPA Entities |
| **Banco de Dados** | Neon PostgreSQL | Serverless Postgres com pooled connection string |
| **Migrações** | Flyway | Versionamento declarativo de banco de dados (`V1__init.sql`) |
| **PDF Engine** | iText 7 Core (8.0.2) | Relatórios PDF vetoriais customizados com paginação |
| **WhatsApp Integration**| Evolution API | Envio programático de mensagens para números e grupos |
| **E-mail / Notificações**| Spring Boot Starter Mail | Notificações SMTP (Gmail) e práticas diárias |

---

## 🗄️ Modelo de Dados (Database Schema)

| Tabela | Descrição | Campos Principais |
|---|---|---|
| `songs` | Catálogo de obras musicais | `id`, `title`, `composer`, `genre`, `original_key`, `mastery_level`, `tempo_bpm`, `notes` |
| `representatives` | Artistas, cantores e projetos | `id`, `name`, `type`, `contact_info`, `active` |
| `representative_songs` | Matriz de tons e notas por artista | `id`, `representative_id`, `song_id`, `performance_key`, `specific_notes` |
| `gigs` | Shows e apresentações agendadas | `id`, `representative_id`, `title`, `event_date`, `venue`, `notes` |
| `gig_items` | Músicas da grade do show | `id`, `gig_id`, `song_id`, `order_index`, `performance_key`, `block_number` |
| `daily_practice_logs` | Histórico e metas de estudo diário | `id`, `song_id`, `practice_date`, `drill_type`, `completed` |

---

## 📲 Integração WhatsApp (Evolution API)

Quando o usuário clica em **"Enviar no WhatsApp"**, o backend monta uma mensagem elegante e despacha para a API:

```text
🎸 ESCALA DO SHOW: Blue Note SP
📅 Data: 15/10/2026 às 21:00
📍 Local: Blue Note São Paulo
🎤 Projeto: Luiza Salles

📌 BLOCO 1
1. [A] Linha do Equador (Djavan)
2. [F] Flor de Lis (Djavan)
3. [C] Capim (Djavan)

📌 BLOCO 2
4. [Ebm] Superstition (Stevie Wonder)
5. [G] Sina (Djavan)

📌 BIS
6. [F] Beiral (Djavan)

🔥 Bom show a todos! Grooves afiados!
```

---

## 💻 Desenvolvimento Local (Guia Passo a Passo)

### Pré-requisitos
- **Node.js 20+** e **pnpm** (ou npm)
- **Java 17 ou 21** e **Maven 3.9+**
- Instância do **PostgreSQL** ou conta no **Neon**

---

### 1. Clonar o Repositório

```bash
git clone https://github.com/jorgesoares2997/caixa_de_repertorio.git
cd caixa_de_repertorio
```

---

### 2. Configurar e Rodar o Backend (Spring Boot)

1. Crie o arquivo `backend/.env` ou configure as variáveis de ambiente:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<neon_host>/neondb?sslmode=require
SPRING_DATASOURCE_USERNAME=neondb_owner
SPRING_DATASOURCE_PASSWORD=your_neon_password

# WhatsApp Evolution API (Opcional para envio de mensagens)
EVOLUTION_API_URL=https://your-evolution-api-instance.com
EVOLUTION_API_APIKEY=your_evolution_api_key
EVOLUTION_API_INSTANCE=your_instance_name
WHATSAPP_TARGET_NUMBER=5511999999999
```

2. Execute o backend via Maven:

```bash
cd backend
mvn clean spring-boot:run
# Backend disponível em http://localhost:8080
```

---

### 3. Popular o Banco de Dados (Seed Automático)

Para carregar as mais de 240+ músicas e cantores iniciais para o banco:

```bash
node backend/seed-neon.js
```

---

### 4. Configurar e Rodar o Frontend (Next.js)

1. Configure o arquivo `frontend/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

2. Instale as dependências e inicie o servidor de desenvolvimento:

```bash
cd frontend
pnpm install
pnpm run dev
# Frontend disponível em http://localhost:3000
```

---

## 📂 Estrutura do Repositório

```
caixa_de_repertorio/
├── backend/
│   ├── src/main/java/com/gigmanager/
│   │   ├── controller/         # SongController, GigController, RepresentativeController, StatsController
│   │   ├── domain/             # Song, Representative, RepresentativeSong, Gig, GigItem
│   │   ├── repository/         # Repositórios JPA e queries customizadas
│   │   └── service/            # PdfService, EvolutionApiService, DailyPracticeScheduler
│   ├── src/main/resources/
│   │   ├── db/migration/       # V1__init.sql (Flyway)
│   │   └── application.yml     # Configurações Spring Boot
│   ├── seed-neon.js            # Script de carga inicial de repertório
│   └── pom.xml                 # Dependências Maven (Spring Boot, iText 7, PostgreSQL, Lombok)
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                # Dashboard com métricas e próximo show
│   │   │   ├── songs/page.tsx          # Acervo central com tabela, filtros e CRUD
│   │   │   ├── representatives/        # Projetos, artistas e repertório exclusivo
│   │   │   ├── gigs/                   # Grade de shows e construtor de setlist
│   │   │   └── not-found.tsx           # Página 404 temática musical
│   │   ├── components/                 # SongFormModal, SongDetailModal, DeleteConfirmModal, MasteryRating, StickerPillButton
│   │   └── lib/                        # store.ts (Zustand com persistência no LocalStorage)
│   ├── public/                         # Assets, logotipos e ilustrações
│   └── package.json                    # Dependências Next.js, TanStack Table, Zustand, Tailwind
│
├── repertorio_completo.json    # Acervo completo de referência (240+ obras)
├── render.yaml                 # Configuração de deploy no Render
└── README.md                   # Documentação do projeto
```

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---

<div align="center">
  Desenvolvido com 🎵 e paixão por música por <b>Jorge Soares</b>.
</div>

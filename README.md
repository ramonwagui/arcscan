# DocSearch 🔍

Sistema SaaS de gestão documental inteligente com OCR automático e busca textual.

---

## ⚡ Como rodar (Modo Demonstração — sem Supabase)

O sistema funciona em **modo demonstração** com dados fictícios. Nenhuma configuração externa é necessária para testar.

### 1. Instalar dependências

```bash
# Terminal 1 — Backend
cd backend
npm install

# Terminal 2 — Frontend
cd frontend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
# Backend
cd backend
copy .env.example .env
# O .env já funciona sem Supabase em modo demo

# Frontend
cd frontend
copy .env.example .env
# O .env já funciona sem Supabase em modo demo
```

### 3. Iniciar os servidores

```bash
# Terminal 1 — Backend (porta 3001)
cd backend
npm run dev

# Terminal 2 — Frontend (porta 5173)
cd frontend
npm run dev
```

### 4. Acessar o sistema

- 🌐 Frontend: http://localhost:5173
- 🔌 API: http://localhost:3001/api/health

### 5. Login de demonstração

```
E-mail:  demo@docsearch.local
Senha:   demo123
```

---

## 🗄️ Configurar Supabase (opcional, para produção)

### 1. Criar projeto em https://supabase.com

### 2. Executar o SQL no Supabase SQL Editor

```sql
-- Copie e execute o conteúdo de ARCHITECTURE.md > Modelo do Banco de Dados
```

### 3. Criar bucket de Storage

No painel do Supabase → Storage → New bucket → Nome: `documents` → Public: OFF

### 4. Preencher variáveis de ambiente

**backend/.env:**
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...  (service_role key)
```

**frontend/.env:**
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...  (anon key)
```

---

## 📁 Estrutura do Projeto

```
Arcscan/
├── frontend/             # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/        # LoginPage, RegisterPage, DashboardPage...
│   │   ├── components/   # Layout (sidebar + topbar)
│   │   ├── context/      # AuthContext (Supabase + mock)
│   │   └── lib/          # api.js, supabase.js, utils.js
│   └── package.json
├── backend/              # Node.js + Express
│   ├── src/
│   │   ├── routes/       # documents.js, search.js, health.js
│   │   ├── services/     # ocrService.js, storageService.js, documentService.js
│   │   └── middleware/   # auth.js, upload.js
│   └── package.json
└── ARCHITECTURE.md
```

---

## 🔧 Stack Tecnológica

| Camada    | Tecnologia            |
|-----------|-----------------------|
| Frontend  | React 18 + Vite       |
| Estilo    | TailwindCSS           |
| Auth      | Supabase Auth         |
| Banco     | Supabase (PostgreSQL) |
| Storage   | Supabase Storage      |
| OCR       | Tesseract.js          |
| Backend   | Node.js + Express     |

---

## 📚 Categorias disponíveis

- 📋 Contratos
- 🧾 Notas Fiscais
- 📨 Ofícios
- 🤝 Convênios
- 🏗️ Projetos
- 🏥 Prontuários
- 📁 Outros

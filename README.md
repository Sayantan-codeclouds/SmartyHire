# 🚀 SmartyHire AI — Next-Gen Autonomous AI Interview & Proctoring Platform

![SmartyHire Banner](https://img.shields.io/badge/SmartyHire-AI_Recruitment_SaaS-indigo?style=for-the-badge&logo=openai)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=for-the-badge&logo=node.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-emerald?style=for-the-badge&logo=mongodb)
![Groq](https://img.shields.io/badge/Groq-LPU_Inference-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

**SmartyHire** is an enterprise-grade, multi-tenant AI recruitment platform designed to automate end-to-end technical and behavioral interviews. Powered by high-speed Groq AI inference, automated anti-cheating & proctoring detection, knowledge document RAG, and automated PDF scorecards, SmartyHire transforms how modern teams screen and hire talent.

---

## 🌟 Key Features

### 🎙️ Autonomous AI Voice Interviews
- **Real-time AI Interviewer**: Conducts natural spoken interviews with low-latency LLM inference powered by Groq.
- **RAG-Powered Question Engine**: Ingests custom company knowledge documents (PDFs/Text) and interview blueprints to generate tailored questions and evaluate contextual domain depth.
- **Adaptive Follow-up Probing**: Dynamically drills down into candidate answers with intelligent follow-up questions.

### 🛡️ Smart Proctoring & Integrity Engine
- **Automated Anti-Cheating Detection**: Tracks tab switches, window unfocus events, copy-paste attempts, and proctoring infractions during the interview session.
- **Trust Score & Violation Logging**: Calculates integrity rating and flags infractions directly in candidate evaluation scorecards.

### 📊 Recruitment Pipeline & Analytics
- **Interactive Kanban Pipeline**: Drag-and-drop workflow tracking (`Applied` → `Scheduled` → `Interviewed` → `Selected` → `Offer Sent` → `Joined`).
- **Comprehensive Scorecards & PDF Export**: Instant generation of branded evaluation reports with radar skill breakdowns, answer transcripts, and hiring recommendations.
- **Cohort Bias & Parity Analytics**: Real-time parity checks to ensure fair, unbiased AI evaluations.

### ⏱️ Candidate Re-Application Cooldown
- **Configurable Access Policy**: Companies can configure interview link cooldown windows (1, 3, 6, or 12 months, default: 3 months) to prevent duplicate submissions while allowing applications to other roles.

### 💼 Multi-Tenant SaaS, Billing & ATS Integration
- **Subscription Management**: Integrated with Razorpay for automated plan upgrades (Free, Starter, Pro, Enterprise).
- **Audit Logging**: Comprehensive workspace security audit trail for all admin actions.
- **ATS Ingestion Webhooks**: Ingest candidate leads directly from external ATS platforms using custom workspace API keys.
- **Automated Email Notifications**: Built-in transactional email dispatch via Resend API and Nodemailer.

---

## 🏗️ Architecture & Tech Stack

```
SmartyHire/
├── backend/                  # Express.js REST API & WebSocket Server
│   ├── src/
│   │   ├── config/           # Database, Groq AI client, and environment setup
│   │   ├── controllers/      # Route controllers (Auth, Candidate, Interview, AI, etc.)
│   │   ├── middlewares/      # JWT Authentication, Upload (Multer), Error Handler
│   │   ├── models/           # Mongoose schemas (Company, User, Candidate, Interview, etc.)
│   │   ├── routes/           # Express API endpoints
│   │   ├── services/         # Groq AI, RAG pipeline, PDF generation, Email dispatch
│   │   ├── utils/            # Audit logger, seed scripts, index helpers
│   │   └── server.js         # HTTP & Socket.IO server entry point
├── frontend/                 # React 19 + Vite SPA
│   ├── src/
│   │   ├── components/       # Reusable UI components & layouts
│   │   ├── context/          # AuthContext, ThemeContext, SocketContext
│   │   ├── pages/            # Dashboard, Interviews, Kanban Pipeline, Candidate Room
│   │   ├── services/         # Axios API client & endpoints
│   │   └── App.jsx           # Client router & protected guards
```

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion, Lucide Icons, Chart.js / Recharts.
- **Backend**: Node.js, Express, MongoDB with Mongoose, Socket.IO, Multer, PDFKit.
- **AI & Integrations**: Groq SDK (`openai/gpt-oss-120b` / `llama-3.3-70b-versatile`), Resend Email API, Razorpay Payment Gateway.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas cluster connection URI
- **Groq API Key**: (Optional for AI fallback mode, recommended for live AI interviews)
- **Resend API Key**: (Optional for live transactional emails)

---

### Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/smartyhire.git
   cd smartyhire
   ```

2. **Install Dependencies**
   Run the root setup script to install dependencies across both `backend` and `frontend`:
   ```bash
   npm run setup
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `backend/` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Fill in your configuration values:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartyhire?retryWrites=true&w=majority
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/smartyhire?retryWrites=true&w=majority

   JWT_SECRET=your_jwt_access_secret_key
   JWT_EXPIRE=7d
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
   JWT_REFRESH_EXPIRE=30d

   CLIENT_URL=http://localhost:5173
   SERVER_URL=http://localhost:5000

   GROQ_API_KEY=gsk_your_groq_api_key
   GROQ_MODEL=openai/gpt-oss-120b

   RESEND_API_KEY=re_your_resend_api_key
   RESEND_FROM_EMAIL="SmartyHire <noreply@yourdomain.com>"

   RAZORPAY_KEY_ID=rzp_test_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret_key
   ```

4. **Seed Database (Optional)**
   Populate initial demo plans, super admin, and blueprint templates:
   ```bash
   npm run seed
   ```

---

## 💻 Running the Application

You can launch both backend and frontend concurrently in development mode:

### Terminal 1 — Backend API Server
```bash
npm run dev:backend
# API server runs on http://localhost:5000
```

### Terminal 2 — Frontend Client
```bash
npm run dev:frontend
# Vite dev server runs on http://localhost:5173
```

---

## 📡 API Endpoints Overview

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register new company workspace |
| **Auth** | `POST` | `/api/auth/login` | Company / Admin user login |
| **Auth** | `POST` | `/api/auth/refresh` | Exchange refresh token for new access token |
| **Auth** | `POST` | `/api/auth/forgot-password` | Send password reset email |
| **Interviews** | `GET` | `/api/interviews` | List all interview blueprints for workspace |
| **Interviews** | `POST` | `/api/interviews` | Create new interview blueprint |
| **Interviews** | `GET` | `/api/interviews/public/:publicId` | Fetch public interview metadata for candidates |
| **Candidates**| `POST` | `/api/candidates/register` | Register candidate & enforce cooldown policy |
| **Candidates**| `GET` | `/api/candidates/session/:candidateId`| Start interview session & generate assigned questions |
| **Candidates**| `POST` | `/api/candidates/response` | Submit candidate answer recording/transcript |
| **Candidates**| `POST` | `/api/candidates/violation` | Log proctoring security infraction |
| **AI** | `POST` | `/api/ai/evaluate` | Trigger automated Groq scorecard evaluation |
| **Knowledge** | `POST` | `/api/knowledge/upload` | Upload PDF documentation to company knowledge vault |
| **Payments** | `POST` | `/api/payments/create-order` | Create Razorpay subscription order |
| **Company** | `PUT` | `/api/company/settings` | Update branding, accent colors, and cooldown policies |

---

## 🔒 Security & Best Practices

- **Token Security**: Stateless JWTs with secure refresh token rotation.
- **Input Sanitization & Validation**: Strict Mongoose schema validations, Multer file type whitelists, and bounded payload limits.
- **Rate Limiting**: Integrated `express-rate-limit` on public candidate ingestion endpoints.
- **Role-Based Access Control (RBAC)**: Dedicated guards for `Super Admin`, `Company Admin`, and `Recruiter`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by the <b>SmartyHire AI</b> Engineering Team</sub>
</div>

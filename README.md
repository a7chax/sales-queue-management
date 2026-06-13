# 🏪 Sales Queue Manager

> **Real-time sales operations dashboard** — manage customer queues, multi-customer sales conversations, sentiment analytics, and revenue tracking, all in one place.

Built as a hackathon MVP in Next.js with zero external dependencies (no database, no AI, no third-party APIs). Everything runs in-memory and feels like a real production tool.

![Tech](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![UI](https://img.shields.io/badge/shadcn%2Fui-+-000)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)
![Status](https://img.shields.io/badge/status-MVP-success)

---

## 📋 Table of Contents

- [What It Does](#-what-it-does)
- [Problem & Solution](#-problem--solution)
- [Key Features](#-key-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [Quick Start](#-quick-start)
- [Architecture](#%EF%B8%8F-architecture)
- [API Reference](#-api-reference)
- [Demo Script](#-demo-script)
- [Screenshots](#-screenshots)
- [Roadmap](#-roadmap)

---

## 🎯 What It Does

Sales Queue Manager is an **operational dashboard** for businesses with walk-in customers and multiple sales people — think car dealerships, jewelry stores, electronics showrooms, or premium retail.

The system handles:

1. **Customer intake** with Premium / Normal priority
2. **Smart auto-assignment** to sales (load-balanced + rating-aware)
3. **Live conversation simulation** between sales and customers (templated, phase-aware)
4. **Outcome tracking** — Deal / Lost / Follow Up with auto-rating + customer feedback
5. **Revenue analytics** — realized, potential, and lost revenue with funnel visualization
6. **Performance leaderboard** — sales ranked by rating, deals, and response speed
7. **Historical audit** — full chat history per customer, filterable

---

## 💡 Problem & Solution

### Problems we solve

| # | Pain Point | Impact |
|---|------------|--------|
| 1 | VIP customers wait in same queue as everyone else | Lost premium revenue |
| 2 | Manager can't see who's busy / free in real-time | Uneven workload |
| 3 | No visibility into sales–customer conversations | Can't coach |
| 4 | Sales performance is subjective | Hard to evaluate fairly |
| 5 | Customer feedback evaporates after a sale | No improvement loop |
| 6 | Deal trends only known end-of-day | Reactive, not proactive |
| 7 | Each sales handles only 1 customer at a time | Capacity wasted |

### How we solve them

| Problem | Solution | How it works |
|---------|----------|--------------|
| #1 | **Priority Queue** | Premium customers automatically sorted to the front |
| #2 | **Auto-Assign + Manual Override** | Load-balanced assignment with dropdown override |
| #3 | **Live Chat & Activity Feed** | Every conversation visible + streaming feed |
| #4 | **Sales Leaderboard** | Ranked by avg rating + close rate + response speed |
| #5 | **Auto-Rating + Sentiment** | Each finished customer auto-rates 1–5⭐ with feedback |
| #6 | **Realtime Charts** | Deals timeline + revenue funnel, refresh every 1.5s |
| #7 | **Multi-customer per Sales** | Each sales serves up to 3 customers in parallel |

---

## ✨ Key Features

### 🚦 Queue Management
- Priority queue: Premium 👑 always ahead of Normal 🙂
- Auto-generate customer every 10 seconds (simulates real traffic)
- Manual customer add with name + type
- **Manual assignment** via dropdown per queue item

### 🧠 Smart Auto-Routing
- **Premium customers → highest-rated sales** (top performer handles VIPs)
- **Normal customers → lowest-rated sales** (gives them practice)
- Load-balanced across all available sales (max 3 each)
- Visual cue: top sales gets `👑 VIP Handler` badge, bottom gets `🙂 Normal Track`

### 👥 Sales Panel (Multi-Customer)
- Each sales handles up to **3 customers simultaneously**
- Load bar visual: green (idle) / blue (partial) / red (full)
- Per-customer Chat + Finish actions
- Dynamic add/remove sales on the fly

### 💬 Phase-Aware Chat System
- ~128 templated lines across 4 phases:
  - **Opener** — greetings, initial inquiry
  - **Early** (0–3 msgs) — getting acquainted
  - **Mid** (4–11 msgs) — discussion, negotiation, questions
  - **Late** (12+ msgs) — closing, objections, decision
- Customer responses adapt to mood:
  - 😊 **Easy Deal** — agreeable, ready to buy
  - 💸 **Negotiator** — pushes for discounts, bonuses
  - ❓ **Many Questions** — needs lots of clarification
- Auto-chat ticker advances all conversations every **2.5s**
- Chat capped at **20 messages** → auto-concludes with Deal/Lost/Follow Up

### ⭐ Rating & Sentiment
- Auto-rating from `result × mood × jitter` (1–5 stars, 0.5 increments)
- Auto-feedback from high/mid/low pools
- Sentiment buckets: 😊 Puas / 😐 Netral / 😞 Tidak Puas
- Combined progress bar visualization

### 💰 Revenue Tracking
- Each customer gets a `dealValue` (Premium Rp 5–50jt, Normal Rp 1–10jt)
- Three revenue metrics:
  - **Realized** — deal customer values (sudah closed)
  - **Potential** — active pipeline + follow-up customer values
  - **Lost** — lost customer values (gone to competitor)
- Win Rate = Realized / (Realized + Lost)
- Funnel chart with stacked bar + 3 detail cards

### 📊 Analytics Dashboard
- 6 KPI cards: Waiting, Serving, Deal, Lost, Follow Up, Avg Rating
- 4 Revenue cards: Realized, Potential, Lost, Win Rate
- **Sentimen Pelanggan** — distribution of satisfaction
- **Deals Timeline** — stacked bar chart, 20 buckets × 30s = last 10 minutes
- **Sales Leaderboard** — rank by rating, deals, ⚡ response speed
- **Live Activity Feed** — streaming chat snippets
- **Testimoni Wall** — positive customer feedback gallery

### 🗂️ History Table
- Full data table with 10 columns
- Filter by: Result, Sales, Rating bucket, name search
- View full chat history per customer (read-only dialog)
- Color-coded response speed indicator

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 14** (App Router) |
| UI | **shadcn/ui** + Tailwind CSS + Lucide icons |
| Language | JavaScript |
| State Management | React `useState` + polling (1.5s) |
| Storage | **In-memory** (`globalThis` singleton) |
| API | Next.js API Routes (catch-all `[[...path]]`) |
| Charts | Custom CSS/SVG (no chart library) |

**Why in-memory?** This is a hackathon MVP. Zero infrastructure, zero cost, instant reset. Easy to swap with MongoDB/Postgres later.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Yarn (recommended) or npm

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/sales-queue-manager.git
cd sales-queue-manager

# Install dependencies
yarn install

# Run dev server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

### First-time demo

1. Click **Demo Data** → seeds 5 sample customers
2. Watch them auto-assign to Sales A/B/C
3. Auto-chat ticker advances conversations
4. After ~50s each chat auto-concludes (Deal / Lost / Follow Up)
5. New customers auto-generate every 10s
6. Watch the dashboard come alive: charts, leaderboard, sentiment, revenue 📈

### Reset state

Click **Reset** in the header to clear all customers (keeps sales intact).

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│  Frontend (Next.js Client Component)            │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Polling   │  │  Auto-Chat  │  │ Auto-Gen │ │
│  │  every 1.5s│  │  ticker 2.5s│  │  10s     │ │
│  └─────┬──────┘  └──────┬──────┘  └─────┬────┘ │
└────────┼─────────────────┼────────────────┼─────┘
         │                 │                │
         ▼ /api/status     ▼ /api/chat/tick ▼ /api/demo/random
┌──────────────────────────────────────────────────┐
│  Backend (Next.js API Route - catch-all)         │
│  • REST endpoints under /api/*                   │
│  • Auto-assign logic (load-balanced + rating)    │
│  • Auto-conclude when chat hits 20 msgs          │
│  • Snapshot computation (stats, timeline, etc)   │
└──────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────┐
│  In-Memory Store (globalThis singleton)          │
│  {                                               │
│    customers: [{id, name, type, mood, status,    │
│                 result, rating, dealValue,       │
│                 chat[], ...}],                   │
│    sales: [{id, name, currentCustomerIds[],      │
│              startedAtMap{}, ...}],              │
│    nextCustomerId: number                        │
│  }                                               │
└──────────────────────────────────────────────────┘
```

### Data flow (typical action)

```
User clicks "Add Customer"
    ↓
POST /api/customers { name, type }
    ↓
Store.customers.push(newCustomer)
    ↓
tryAutoAssign() runs
    ↓
Smart route: Premium → top-rated sales, Normal → bottom-rated
    ↓
Response: { customer, snapshot }
    ↓
Frontend refreshes UI
```

---

## 📡 API Reference

All endpoints prefixed with `/api`. JSON request/response.

### Status

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Full dashboard snapshot (queue, sales, history, stats, timeline, activity) |

### Customers

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/customers` | `{ name, type }` | Add a customer (auto-assigns if sales available) |
| `POST` | `/demo/seed` | `{}` | Insert 5 sample customers |
| `POST` | `/demo/random` | `{}` | Insert 1 random customer |
| `POST` | `/demo/reset` | `{}` | Clear all customers, reset sales |

### Service

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/service/start` | `{ salesId, customerId? }` | Manually start a service |
| `POST` | `/service/finish` | `{ salesId, customerId, result }` | Mark service finished (`result`: `deal`/`lost`/`followup`) |
| `POST` | `/assign` | `{ salesId, customerId }` | Manually assign specific customer to specific sales |

### Sales

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/sales/add` | `{ name? }` | Add new sales (auto-named if no name) |
| `POST` | `/sales/remove` | `{ salesId }` | Remove sales (only if idle) |

### Chat

| Method | Path | Body | Description |
|--------|------|------|-------------|
| `POST` | `/chat/send` | `{ salesId, customerId, text }` | Send message as sales (customer auto-replies) |
| `POST` | `/chat/quick` | `{ salesId, customerId }` | Auto-generate 1 turn of conversation |
| `POST` | `/chat/tick` | `{}` | Advance all active conversations by 1 message |

### Example: Add a customer

```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Santoso","type":"premium"}'
```

Response:
```json
{
  "customer": {
    "id": 1,
    "name": "Budi Santoso",
    "type": "premium",
    "mood": "Negotiator",
    "status": "serving",
    "dealValue": 23450000,
    "servedBy": 2
  },
  "snapshot": { /* ... full state ... */ }
}
```

---

## 🎬 Demo Script

**3-minute walk-through** for presenting:

> **[0:00]** "Bayangkan dealership atau showroom. Customer Premium kadang antri di belakang. Sales A nganggur, Sales B kewalahan. Manager nggak tahu apa yang terjadi."
>
> **[0:20]** Click **Demo Data** → "5 customer langsung masuk, Premium auto di depan, langsung di-assign ke 3 sales."
>
> **[0:40]** "Auto-Gen tiap 10 detik bikin customer baru. Auto-Chat tiap 2.5 detik majukan percakapan. Tidak ada yang nganggur."
>
> **[1:00]** "Tiap sales bisa handle 3 customer paralel. Lihat load bar — Sales A full, Sales C masih bisa terima."
>
> **[1:30]** Demo manual assign: click **Assign →** in queue, pick sales. "Manager bisa override penugasan untuk VIP penting."
>
> **[2:00]** Scroll: "Sentimen 51% Puas. Deals Timeline menunjukkan tren 10 menit terakhir. Leaderboard kasih tahu Sales A paling cepat balas (766ms), 64% close rate."
>
> **[2:30]** Scroll lagi: "Revenue Funnel — Realized Rp 410jt, Potential Rp 495jt, Lost Rp 377jt. Win rate 52%."
>
> **[2:45]** Scroll ke History: filter by 'Lost', click View Chat → "Lihat percakapan lengkap untuk coaching."
>
> **[3:00]** "Semua ini in-memory, zero cost. Ready to demo, ready to scale."

---

## 📸 Screenshots

> *Run the app and watch the dashboard come alive!*

- **Header & Stats** — 6 KPI cards + Auto-Gen/Auto-Chat toggles
- **Revenue Cards** — 4 revenue metrics with color-coded borders
- **Revenue Funnel** — stacked bar + breakdown cards
- **Sentimen + Timeline** — sentiment distribution + deals over time
- **Queue + Sales Panel** — multi-customer with chat/finish buttons
- **History Table** — 10-column filterable data table
- **Sales Leaderboard** — ranked with response speed
- **Live Activity Feed** — streaming chat snippets
- **Testimoni Wall** — gradient-colored testimonial cards

---

## 🗺️ Roadmap

### Phase 1 (1–2 weeks)
- [ ] Persist to MongoDB / PostgreSQL
- [ ] Replace polling with WebSocket / Server-Sent Events
- [ ] Authentication: separate sales login, manager view
- [ ] Configurable `MAX_LOAD` and routing rules via admin panel

### Phase 2 (1 month)
- [ ] Real customer chat integration (WhatsApp Business / Telegram)
- [ ] AI assistant for sales (suggested replies, sentiment detection)
- [ ] CSV / PDF export of history and revenue reports
- [ ] Daily/weekly leaderboard with rewards system

### Phase 3 (Production)
- [ ] Multi-branch / multi-tenant support
- [ ] Mobile app for field sales
- [ ] Predictive analytics (deal forecasting from historical patterns)
- [ ] Integration with CRM (HubSpot, Salesforce, etc.)

---

## 📂 Project Structure

```
sales-queue-manager/
├── app/
│   ├── api/
│   │   └── [[...path]]/
│   │       └── route.js          # All API endpoints (catch-all)
│   ├── layout.js                 # Root layout with Inter font
│   ├── page.js                   # Main dashboard (single-page app)
│   └── globals.css               # Tailwind imports
├── components/
│   └── ui/                       # shadcn/ui components
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       ├── dropdown-menu.jsx
│       ├── table.jsx
│       └── ...
├── lib/
│   └── utils.js                  # cn() helper for class merging
├── public/
├── .env                          # MONGO_URL, NEXT_PUBLIC_BASE_URL
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md                     # ← you are here
```

---

## 🧪 How the smart routing actually works

```javascript
function tryAutoAssign() {
  while (queue.length > 0) {
    const next = queue[0];
    const available = sales.filter(s => s.load < MAX_LOAD);
    if (available.length === 0) break;

    if (next.type === 'premium') {
      // VIP gets the best
      available.sort((a, b) => b.avgRating - a.avgRating || a.load - b.load);
    } else {
      // Normal goes to lower-rated (give them practice)
      available.sort((a, b) => a.avgRating - b.avgRating || a.load - b.load);
    }

    assign(available[0], next);
  }
}
```

This ensures:
- High-value customers get high-performing sales
- Lower-rated sales get steady practice without risking VIP relationships
- Workload stays balanced (tie-breaker by current load)

---

## 🧑‍💻 Contributing

This is a hackathon prototype. PRs welcome for:
- Bug fixes
- New chat templates (add to `CHAT_TEMPLATES` / `SALES_LINES`)
- Additional visualizations
- Persistence layer implementation

---

## 📜 License

MIT — feel free to use, modify, and share.

---

## 🙏 Acknowledgments

- **shadcn/ui** for beautiful, accessible components out of the box
- **Lucide** for the icon set
- **Tailwind CSS** for rapid styling
- **Next.js** team for the unified frontend + API framework

---

> Built with ❤️ for the **Hackathon MVP** — proving you can ship a real-feeling product in 1 hour.

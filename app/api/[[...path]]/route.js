import { NextResponse } from 'next/server';

// ============== IN-MEMORY STORE ==============
const g = globalThis;
if (!g.__QUEUE_STORE__) {
  g.__QUEUE_STORE__ = {
    customers: [],
    sales: [
      { id: 1, name: 'Sales A', currentCustomerId: null, startedAt: null },
      { id: 2, name: 'Sales B', currentCustomerId: null, startedAt: null },
      { id: 3, name: 'Sales C', currentCustomerId: null, startedAt: null },
    ],
    nextCustomerId: 1,
  };
}
const store = g.__QUEUE_STORE__;

const MOODS = ['Easy Deal', 'Negotiator', 'Many Questions'];
const NAMES = [
  'Ali Pratama', 'Budi Santoso', 'Sinta Dewi', 'Dedi Saputra', 'Ina Maulida',
  'Umar Bakri', 'Rina Wijaya', 'Joko Susilo', 'Maya Sari', 'Andi Kurnia',
  'Lina Hartono', 'Bagas Pradana', 'Citra Lestari', 'Doni Hermawan', 'Eka Putri',
  'Fajar Nugroho', 'Gita Anggraini', 'Hadi Sutrisno', 'Indah Permata', 'Yusuf Rahman',
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CHAT_TEMPLATES = {
  'Easy Deal': {
    opener: [
      'Halo, saya tertarik dengan produknya!',
      'Hai kak, mau lihat-lihat dulu ya 😊',
      'Selamat siang, langsung ke produk unggulannya aja',
    ],
    reply: [
      'Oke siap, lanjut!',
      'Wah menarik nih',
      'Setuju, bisa langsung diproses',
      'Mantap, saya ambil yang itu',
      'Oke, bagaimana cara bayarnya?',
      'Sip, saya percaya rekomendasinya',
      'Boleh, langsung checkout aja deh',
      'Asik, kapan barangnya sampai?',
      'Oke fix saya order sekarang',
    ],
  },
  'Negotiator': {
    opener: [
      'Bisa kasih diskon nggak nih? 💸',
      'Harga di tempat lain lebih murah lho kak',
      'Kalau saya ambil 2, dapat potongan berapa?',
    ],
    reply: [
      'Hmm masih kemahalan menurut saya',
      'Bisa turun lagi nggak harganya?',
      'Tambahin bonus dong biar deal',
      'Coba saya pikir-pikir dulu deh',
      'Kalau cash bisa diskon berapa?',
      'Kompetitor kasih harga lebih murah lho',
      'Bisa free ongkir gak minimal?',
      'Voucher diskon ada? Saya member soalnya',
      'Hmm, kalau segini gak deal saya',
      'Oke deh, kalau dapat bonus saya ambil',
    ],
  },
  'Many Questions': {
    opener: [
      'Spesifikasi lengkapnya apa aja ya? ❓',
      'Garansinya berapa lama kak?',
      'Bedanya sama produk sebelah apa?',
    ],
    reply: [
      'Oh gitu, terus warnanya ada apa aja?',
      'Tahan banting nggak ini?',
      'Kalau rusak, service-nya di mana?',
      'Sertifikatnya resmi kan ya?',
      'Hmm pertanyaan lagi, sabar ya kak 😅',
      'Baterainya tahan berapa jam?',
      'Bisa dipakai untuk anak-anak nggak?',
      'Komposisinya aman kan? Saya alergi soalnya',
      'Lebih bagus seri lama atau baru?',
      'Kalau ditukar bisa? Saya masih ragu',
    ],
  },
};

const SALES_REPLIES = [
  'Tentu kak, saya bantu jelaskan',
  'Boleh saya cek dulu sebentar ya',
  'Untuk produk ini ada penawaran spesial',
  'Siap kak, sudah saya catat',
  'Bisa kak, untuk Anda kami kasih harga terbaik',
  'Kami punya promo bundling juga lho',
  'Spesial hari ini ada cashback 10%',
  'Garansi resmi 1 tahun penuh ya kak',
  'Stock-nya tinggal sedikit, mumpung masih ada',
  'Mau saya bantu siapkan invoice-nya?',
  'Boleh saya tunjukkan produk yang lebih cocok?',
  'Ada testimoni 4.8/5 dari customer kami lho',
  'Kalau ambil sekarang free ongkir kak',
  'Saya kasih bonus aksesoris ya kalau deal hari ini',
];

function makeCustomer({ name, type, mood }) {
  return {
    id: store.nextCustomerId++,
    name: name || pick(NAMES),
    type: type || (Math.random() < 0.4 ? 'premium' : 'normal'),
    mood: mood || pick(MOODS),
    status: 'waiting',
    result: null,
    rating: null,
    feedback: null,
    createdAt: Date.now(),
    servedBy: null,
    startedAt: null,
    finishedAt: null,
    chat: [],
  };
}

// Auto-generate rating + feedback based on result + mood
function generateRating(customer) {
  const result = customer.result;
  const mood = customer.mood;
  let base;
  if (result === 'deal') base = 4.5;
  else if (result === 'followup') base = 3.5;
  else base = 2.0; // lost
  // mood modifier
  if (mood === 'Easy Deal') base += 0.3;
  else if (mood === 'Negotiator') base -= 0.3;
  // a bit of randomness
  const jitter = (Math.random() - 0.5) * 0.8;
  const rating = Math.max(1, Math.min(5, Math.round((base + jitter) * 2) / 2));

  const FEEDBACK = {
    high: [
      'Sales sangat ramah dan informatif!',
      'Pelayanannya cepat, saya puas banget.',
      'Penjelasan detail, recommended seller.',
      'Top! Pasti balik lagi.',
      'Pengalaman belanja yang menyenangkan.',
    ],
    mid: [
      'Lumayan, tapi bisa lebih baik.',
      'Pelayanan oke, harga bisa lebih murah.',
      'Cukup membantu, masih ada yang perlu ditingkatkan.',
      'Biasa aja, standar lah.',
    ],
    low: [
      'Pelayanannya kurang memuaskan.',
      'Sales kurang sabar menjawab pertanyaan.',
      'Harga terlalu mahal, tidak deal.',
      'Penjelasannya kurang jelas.',
    ],
  };
  const bucket = rating >= 4 ? 'high' : rating >= 3 ? 'mid' : 'low';
  return { rating, feedback: pick(FEEDBACK[bucket]) };
}

function getQueue() {
  return store.customers
    .filter(c => c.status === 'waiting')
    .sort((a, b) => {
      if (a.type === b.type) return a.createdAt - b.createdAt;
      return a.type === 'premium' ? -1 : 1;
    });
}

function snapshot() {
  const queue = getQueue();
  const sales = store.sales.map(s => {
    // per-sales aggregate
    const served = store.customers.filter(c => c.servedBy === s.id && c.status === 'finished');
    const ratings = served.map(c => c.rating).filter(r => r != null);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    return {
      ...s,
      currentCustomer: s.currentCustomerId
        ? store.customers.find(c => c.id === s.currentCustomerId) || null
        : null,
      stats: {
        served: served.length,
        deals: served.filter(c => c.result === 'deal').length,
        lost: served.filter(c => c.result === 'lost').length,
        followup: served.filter(c => c.result === 'followup').length,
        avgRating: Math.round(avg * 10) / 10,
        ratingCount: ratings.length,
      },
    };
  });
  const finished = store.customers.filter(c => c.status === 'finished');
  const allRatings = finished.map(c => c.rating).filter(r => r != null);
  const overallAvg = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;

  // recent activity feed: last 8 chat messages across all serving customers
  const activity = [];
  for (const c of store.customers) {
    if (c.status !== 'serving' && c.status !== 'finished') continue;
    for (const m of (c.chat || [])) {
      activity.push({ ...m, customerName: c.name, customerType: c.type });
    }
  }
  activity.sort((a, b) => b.ts - a.ts);

  return {
    queue,
    sales,
    customers: store.customers,
    history: finished.sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0)),
    activity: activity.slice(0, 10),
    stats: {
      waiting: queue.length,
      serving: store.customers.filter(c => c.status === 'serving').length,
      finished: finished.length,
      deal: finished.filter(c => c.result === 'deal').length,
      lost: finished.filter(c => c.result === 'lost').length,
      followup: finished.filter(c => c.result === 'followup').length,
      avgRating: Math.round(overallAvg * 10) / 10,
      ratingCount: allRatings.length,
    },
  };
}

function assignNextToSales(sales) {
  const queue = getQueue();
  if (queue.length === 0) return null;
  const next = queue[0];
  next.status = 'serving';
  next.servedBy = sales.id;
  next.startedAt = Date.now();
  sales.currentCustomerId = next.id;
  sales.startedAt = Date.now();

  // Seed initial chat: sales greeting + customer opener (mood-based)
  if (!next.chat) next.chat = [];
  if (next.chat.length === 0) {
    const tpl = CHAT_TEMPLATES[next.mood] || CHAT_TEMPLATES['Easy Deal'];
    next.chat.push({
      id: Date.now(),
      from: 'sales',
      author: sales.name,
      text: `Halo ${next.name}, selamat datang! Ada yang bisa saya bantu?`,
      ts: Date.now(),
    });
    next.chat.push({
      id: Date.now() + 1,
      from: 'customer',
      author: next.name,
      text: pick(tpl.opener),
      ts: Date.now() + 50,
    });
  }
  return next;
}

// Auto-assign: keep assigning queue to any available sales
function tryAutoAssign() {
  const assignments = [];
  for (const s of store.sales) {
    if (s.currentCustomerId) continue;
    const next = assignNextToSales(s);
    if (next) assignments.push({ salesId: s.id, customer: next });
    else break;
  }
  return assignments;
}

async function handle(request, { params }) {
  const segments = (params?.path) || [];
  const path = '/' + segments.join('/');
  const method = request.method;

  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try { body = await request.json(); } catch { body = {}; }
  }

  try {
    if (path === '/status' && method === 'GET') {
      return NextResponse.json(snapshot());
    }

    if (path === '/customers' && method === 'POST') {
      const { name, type, mood } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
      }
      const customer = makeCustomer({ name: name.trim(), type, mood });
      store.customers.push(customer);
      tryAutoAssign();
      return NextResponse.json({ customer, snapshot: snapshot() }, { status: 201 });
    }

    if (path === '/service/start' && method === 'POST') {
      const { salesId } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      if (sales.currentCustomerId) {
        return NextResponse.json({ error: 'Sales sedang sibuk' }, { status: 400 });
      }
      const customer = assignNextToSales(sales);
      if (!customer) {
        return NextResponse.json({ error: 'Antrean kosong' }, { status: 400 });
      }
      return NextResponse.json({ salesId, customer, snapshot: snapshot() });
    }

    if (path === '/service/finish' && method === 'POST') {
      const { salesId, result } = body;
      if (!['deal', 'lost', 'followup'].includes(result)) {
        return NextResponse.json({ error: 'Result harus deal/lost/followup' }, { status: 400 });
      }
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales || !sales.currentCustomerId) {
        return NextResponse.json({ error: 'Sales tidak melayani siapa pun' }, { status: 400 });
      }
      const customer = store.customers.find(c => c.id === sales.currentCustomerId);
      if (customer) {
        customer.status = 'finished';
        customer.result = result;
        customer.finishedAt = Date.now();
        const r = generateRating(customer);
        customer.rating = r.rating;
        customer.feedback = r.feedback;
      }
      sales.currentCustomerId = null;
      sales.startedAt = null;
      tryAutoAssign();
      return NextResponse.json({ salesId, finishedCustomer: customer, snapshot: snapshot() });
    }

    if (path === '/demo/seed' && method === 'POST') {
      const samples = [
        { name: 'Ali Pratama', type: 'premium', mood: 'Negotiator' },
        { name: 'Budi Santoso', type: 'normal', mood: 'Easy Deal' },
        { name: 'Sinta Dewi', type: 'premium', mood: 'Many Questions' },
        { name: 'Dedi Saputra', type: 'normal', mood: 'Easy Deal' },
        { name: 'Ina Maulida', type: 'premium', mood: 'Negotiator' },
      ];
      samples.forEach(s => store.customers.push(makeCustomer(s)));
      tryAutoAssign();
      return NextResponse.json({ ok: true, snapshot: snapshot() });
    }

    // auto-generate 1 random customer (for the 10s ticker)
    if (path === '/demo/random' && method === 'POST') {
      // avoid duplicate consecutive names
      const last = store.customers.at(-1)?.name;
      let nm = pick(NAMES);
      let tries = 0;
      while (nm === last && tries++ < 5) nm = pick(NAMES);
      const customer = makeCustomer({ name: nm });
      store.customers.push(customer);
      tryAutoAssign();
      return NextResponse.json({ customer, snapshot: snapshot() });
    }

    // Auto-tick: advance ALL ongoing chats by one turn (alternating speakers)
    if (path === '/chat/tick' && method === 'POST') {
      const advances = [];
      for (const s of store.sales) {
        if (!s.currentCustomerId) continue;
        const customer = store.customers.find(c => c.id === s.currentCustomerId);
        if (!customer) continue;
        if (!customer.chat) customer.chat = [];
        // Cap chat length so it doesn't grow forever (max 30 messages per session)
        if (customer.chat.length >= 30) continue;

        const last = customer.chat[customer.chat.length - 1];
        const lastFrom = last?.from;
        // Alternate: if last was sales, customer speaks next; vice versa.
        // If empty, customer opens (sales already greeted at start).
        const from = lastFrom === 'sales' ? 'customer' : 'sales';
        const tpl = CHAT_TEMPLATES[customer.mood] || CHAT_TEMPLATES['Easy Deal'];
        const text = from === 'sales' ? pick(SALES_REPLIES) : pick(tpl.reply);
        const author = from === 'sales' ? s.name : customer.name;
        const now = Date.now();
        customer.chat.push({
          id: now + Math.random(),
          from,
          author,
          text,
          ts: now,
        });
        advances.push({ salesId: s.id, customerId: customer.id, from, text });
      }
      return NextResponse.json({ ok: true, advances, snapshot: snapshot() });
    }

    // CHAT: sales sends a message; customer auto-replies based on mood
    if (path === '/chat/send' && method === 'POST') {
      const { salesId, text } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales || !sales.currentCustomerId) {
        return NextResponse.json({ error: 'Sales tidak melayani siapa pun' }, { status: 400 });
      }
      const customer = store.customers.find(c => c.id === sales.currentCustomerId);
      if (!customer) return NextResponse.json({ error: 'Customer tidak ditemukan' }, { status: 404 });
      if (!customer.chat) customer.chat = [];

      const trimmed = (text || '').trim();
      const salesText = trimmed || pick(SALES_REPLIES);
      const now = Date.now();
      customer.chat.push({
        id: now,
        from: 'sales',
        author: sales.name,
        text: salesText,
        ts: now,
      });
      // auto reply from customer based on mood
      const tpl = CHAT_TEMPLATES[customer.mood] || CHAT_TEMPLATES['Easy Deal'];
      customer.chat.push({
        id: now + 1,
        from: 'customer',
        author: customer.name,
        text: pick(tpl.reply),
        ts: now + 100,
      });
      return NextResponse.json({ ok: true, chat: customer.chat });
    }

    // Quick-send: just trigger a sales auto-message (button on the chat UI)
    if (path === '/chat/quick' && method === 'POST') {
      const { salesId } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales || !sales.currentCustomerId) {
        return NextResponse.json({ error: 'Sales tidak melayani siapa pun' }, { status: 400 });
      }
      const customer = store.customers.find(c => c.id === sales.currentCustomerId);
      if (!customer) return NextResponse.json({ error: 'Customer tidak ditemukan' }, { status: 404 });
      if (!customer.chat) customer.chat = [];
      const now = Date.now();
      customer.chat.push({
        id: now, from: 'sales', author: sales.name, text: pick(SALES_REPLIES), ts: now,
      });
      const tpl = CHAT_TEMPLATES[customer.mood] || CHAT_TEMPLATES['Easy Deal'];
      customer.chat.push({
        id: now + 1, from: 'customer', author: customer.name, text: pick(tpl.reply), ts: now + 100,
      });
      return NextResponse.json({ ok: true, chat: customer.chat });
    }

    if (path === '/demo/reset' && method === 'POST') {
      store.customers = [];
      store.nextCustomerId = 1;
      store.sales.forEach(s => {
        s.currentCustomerId = null;
        s.startedAt = null;
      });
      return NextResponse.json({ ok: true, snapshot: snapshot() });
    }

    return NextResponse.json({ error: 'Not Found', path, method }, { status: 404 });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;

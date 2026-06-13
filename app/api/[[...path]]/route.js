import { NextResponse } from 'next/server';

const MAX_LOAD = 3; // max concurrent customers per sales

// ============== IN-MEMORY STORE ==============
const g = globalThis;
if (!g.__QUEUE_STORE__) {
  g.__QUEUE_STORE__ = {
    customers: [],
    sales: [
      { id: 1, name: 'Sales A', currentCustomerIds: [], startedAtMap: {} },
      { id: 2, name: 'Sales B', currentCustomerIds: [], startedAtMap: {} },
      { id: 3, name: 'Sales C', currentCustomerIds: [], startedAtMap: {} },
    ],
    nextCustomerId: 1,
  };
} else {
  // Migrate old schema (single customer) to multi-customer
  g.__QUEUE_STORE__.sales.forEach(s => {
    if (s.currentCustomerIds === undefined) {
      s.currentCustomerIds = s.currentCustomerId ? [s.currentCustomerId] : [];
      s.startedAtMap = s.startedAt && s.currentCustomerId
        ? { [s.currentCustomerId]: s.startedAt }
        : {};
      delete s.currentCustomerId;
      delete s.startedAt;
    }
  });
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

// Phase-aware chat templates: opener (start), early (0-3 msgs), mid (4-11), late (12+)
const CHAT_TEMPLATES = {
  'Easy Deal': {
    opener: [
      'Halo, saya tertarik dengan produknya!',
      'Hai kak, mau lihat-lihat dulu ya 😊',
      'Selamat siang, langsung ke produk unggulannya aja',
      'Pagi! Saya sudah lihat di website, mau cek langsung',
      'Hai, teman saya rekomendasiin produk di sini',
      'Sore, saya tertarik dengan promo yang kemarin',
      'Halo, lagi nyari yang spesifikasinya seperti ini',
    ],
    early: [
      'Wah menarik, ceritakan lebih detail dong',
      'Oke saya simak ya, lanjut',
      'Sip, kebetulan saya lagi cari yang seperti itu',
      'Oh begitu, ada fitur unggulannya apa aja?',
      'Lanjut kak, saya pendengar yang baik kok 😄',
      'Berapa harganya kak?',
      'Boleh saya foto-foto produknya?',
      'Stok-nya banyak gak ya?',
    ],
    mid: [
      'Hmm bagus juga ya, sesuai kebutuhan saya',
      'Saya setuju, masuk akal harga segitu',
      'Oke saya udah cukup paham, mantap',
      'Wah saya makin yakin nih',
      'Sip, kayanya cocok buat saya',
      'Ada warna lain gak? Yang ini bagus tapi',
      'Garansinya tetap penuh kan ya?',
      'Bisa diantar minggu ini gak ke alamat saya?',
      'Cara perawatannya gampang kan?',
    ],
    late: [
      'Oke fix, saya ambil yang ini 🎉',
      'Mantap, langsung proses aja kak',
      'Sip, bagaimana cara bayarnya?',
      'Bisa transfer atau pakai kartu kredit?',
      'Saya checkout sekarang ya',
      'Boleh tolong siapin invoice-nya?',
      'Asik, kapan barangnya sampai ya?',
      'Setuju, terima kasih banyak penjelasannya 🙏',
      'Saya udah ready, tinggal final amount aja',
    ],
  },
  'Negotiator': {
    opener: [
      'Bisa kasih diskon nggak nih? 💸',
      'Harga di tempat lain lebih murah lho kak',
      'Kalau saya ambil 2, dapat potongan berapa?',
      'Wah mahal banget, ada promo gak?',
      'Saya member lama, biasanya dapat harga spesial',
      'Pertama kali ke sini, ada diskon welcome gak?',
      'Eh kak, harga net-nya berapa beneran?',
    ],
    early: [
      'Berapa harga net-nya kak, jangan harga display ya',
      'Tetangga sebelah kasih diskon 15% lho 😏',
      'Kalau cash gimana harganya?',
      'Saya udah survey ke 3 toko, di sini paling mahal',
      'Bonus apa yang bisa saya dapat?',
      'Free ongkir gak ada minimumnya?',
      'Voucher diskon platform bisa dipakai juga?',
      'Buat repeat customer ada extra gak?',
    ],
    mid: [
      'Hmm masih kemahalan menurut saya',
      'Bisa turun lagi nggak harganya, sedikit aja',
      'Tambahin bonus aksesoris dong biar deal',
      'Kompetitor kasih cashback 10% nih, di sini gimana?',
      'Kalau saya rekomendasiin ke teman, ada referral bonus?',
      'Saya beli quantity banyak, harga grosir dong',
      'Cicilan 0% berapa bulan max?',
      'Bisa free aksesoris kalau saya deal sekarang?',
      'Coba telpon supervisor, minta harga spesial dong',
    ],
    late: [
      'Oke deh, kalau dapat bonus saya ambil 🤝',
      'Final price-nya berapa kak, saya mau decide sekarang',
      'Kalau gak bisa turun lagi, saya gak jadi nih',
      'Hmm... oke saya pikir-pikir dulu deh',
      'Bisa ya 10% lagi? Last offer dari saya',
      'Yauda deal, tapi tolong cepetin ya processnya',
      'Saya beneran udah mentok di angka ini, gimana?',
      'Oke saya ambil, tapi besok harus sudah sampai ya',
    ],
  },
  'Many Questions': {
    opener: [
      'Spesifikasi lengkapnya apa aja ya? ❓',
      'Garansinya berapa lama kak?',
      'Bedanya sama produk sebelah apa?',
      'Material/komposisinya apa ya?',
      'Asalnya impor atau lokal nih?',
      'Tahun produksinya berapa? Yang terbaru kan?',
      'Boleh tau supplier resminya siapa?',
    ],
    early: [
      'Oh gitu, terus apa lagi keunggulannya?',
      'Sertifikatnya resmi kan ya? BPOM/SNI/dll',
      'Tahan banting nggak ini?',
      'Berapa lama umur pemakaiannya?',
      'Cocok untuk pemula atau expert?',
      'Aman dipakai sehari-hari kan?',
      'Tahan air sampai berapa meter?',
      'Energi listriknya berapa watt ya?',
    ],
    mid: [
      'Kalau rusak, service-nya di mana?',
      'Baterai/daya tahan berapa jam pemakaian?',
      'Bisa dipakai untuk anak-anak nggak?',
      'Komposisinya aman kan? Saya alergi soalnya',
      'Lebih bagus seri lama atau yang baru?',
      'Reviewnya kebanyakan positif gak di internet?',
      'Apakah ada efek samping/risiko?',
      'Performance-nya stabil dalam jangka panjang?',
      'Sparepart-nya gampang dicari gak?',
    ],
    late: [
      'Hmm masih ragu nih, masih ada pertanyaan 😅',
      'Boleh saya bawa pulang dulu untuk dibanding-bandingkan?',
      'Kalau ditukar dengan yang lain bisa?',
      'Bisa free trial dulu seminggu?',
      'Saya butuh konsultasi sama keluarga dulu',
      'Sebenernya saya tertarik tapi kok masih banyak yang belum jelas ya',
      'Boleh minta brosur lengkap aja deh dulu',
      'Saya cek-cek lagi nanti, pamit dulu ya',
    ],
  },
};

const SALES_LINES = {
  early: [
    'Tentu kak, dengan senang hati saya jelaskan',
    'Selamat datang! Saya bantu sampai dapat yang pas',
    'Produk ini paling laris bulan ini lho',
    'Kebetulan kami baru launching seri terbaru',
    'Saya kasih ringkasan dulu ya supaya hemat waktu Anda',
    'Boleh saya tahu kebutuhan utamanya untuk apa kak?',
    'Mau saya tunjukkan beberapa pilihan dulu?',
    'Spesifikasinya saya lampirkan lengkap di brosur ini',
  ],
  mid: [
    'Untuk produk ini ada penawaran spesial hari ini',
    'Spesial kak, ada cashback 10% sampai akhir bulan',
    'Garansi resmi 1 tahun penuh, bisa diperpanjang',
    'Boleh saya tunjukkan testimoni customer kami?',
    'Rating produk ini 4.8/5 dari 1200+ buyer',
    'Stok-nya tinggal sedikit, mumpung masih ada warna favorit',
    'Saya bisa kasih bonus aksesoris kalau deal hari ini',
    'Bisa kak, untuk Anda kami kasih harga terbaik',
    'Cicilan 0% sampai 12 bulan ada lho',
    'Free ongkir Jabodetabek dan asuransi pengiriman',
    'Kalau ragu, kami juga ada return policy 7 hari',
    'Mau saya bandingin sama produk kompetitor secara fair?',
  ],
  late: [
    'Mau saya bantu siapkan invoice-nya sekarang?',
    'Saya proses ya kak, sebentar saya cek stock',
    'Boleh konfirmasi alamat pengirimannya?',
    'Bisa transfer bank, e-wallet, atau kartu kredit kak',
    'Saya pegang stoknya 1 jam ya, kalau lewat saya lepas',
    'Bagaimana kak? Saya tunggu keputusannya',
    'Kalau deal hari ini bonus extra langsung saya kirim',
    'Anyway terima kasih atas waktunya, semoga jadi rezeki',
    'Bisa saya bantu apa lagi kak?',
    'Boleh tinggalkan kontak, saya follow up minggu depan',
    'Kapan-kapan boleh mampir lagi ya kak',
  ],
};

// Pick context-aware line for sales/customer based on conversation phase
function pickLine(from, customer, chatLength) {
  let phase;
  if (chatLength < 4) phase = 'early';
  else if (chatLength < 12) phase = 'mid';
  else phase = 'late';

  if (from === 'sales') {
    return pick(SALES_LINES[phase] || SALES_LINES.mid);
  }
  // customer
  const tpl = CHAT_TEMPLATES[customer.mood] || CHAT_TEMPLATES['Easy Deal'];
  return pick(tpl[phase] || tpl.mid || tpl.early || tpl.opener);
}

function makeCustomer({ name, type, mood }) {
  const t = type || (Math.random() < 0.4 ? 'premium' : 'normal');
  // Deal value (IDR): premium 5-50jt, normal 1-10jt
  const dealValue = t === 'premium'
    ? Math.round((5 + Math.random() * 45) * 100) * 10000  // 5.0jt - 50.0jt step 10k
    : Math.round((1 + Math.random() * 9) * 100) * 10000;  // 1.0jt - 10.0jt
  return {
    id: store.nextCustomerId++,
    name: name || pick(NAMES),
    type: t,
    mood: mood || pick(MOODS),
    status: 'waiting',
    result: null,
    rating: null,
    feedback: null,
    dealValue,
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

// Avg sales reply latency from chat (customer→sales delta in ms)
function avgSalesResponseTime(chat) {
  if (!chat || chat.length < 2) return 0;
  let total = 0, count = 0;
  for (let i = 1; i < chat.length; i++) {
    if (chat[i].from === 'sales' && chat[i - 1].from === 'customer') {
      total += chat[i].ts - chat[i - 1].ts;
      count++;
    }
  }
  return count > 0 ? Math.round(total / count) : 0;
}

function snapshot() {
  const queue = getQueue();
  // pre-compute avg response per customer (cached on object so history shows it)
  store.customers.forEach(c => {
    if (c.chat?.length) c.avgResponseMs = avgSalesResponseTime(c.chat);
  });

  const sales = store.sales.map(s => {
    const ids = s.currentCustomerIds || [];
    const currentCustomers = ids
      .map(id => store.customers.find(c => c.id === id))
      .filter(Boolean);
    const served = store.customers.filter(c => c.servedBy === s.id && c.status === 'finished');
    const ratings = served.map(c => c.rating).filter(r => r != null);
    const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const responseTimes = served.map(c => c.avgResponseMs || 0).filter(t => t > 0);
    const avgResp = responseTimes.length
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;
    return {
      ...s,
      currentCustomers,
      load: currentCustomers.length,
      capacity: MAX_LOAD,
      currentCustomer: currentCustomers[0] || null,
      currentCustomerId: ids[0] || null,
      stats: {
        served: served.length,
        deals: served.filter(c => c.result === 'deal').length,
        lost: served.filter(c => c.result === 'lost').length,
        followup: served.filter(c => c.result === 'followup').length,
        avgRating: Math.round(avg * 10) / 10,
        ratingCount: ratings.length,
        currentLoad: currentCustomers.length,
        avgResponseMs: avgResp,
      },
    };
  });
  const finished = store.customers.filter(c => c.status === 'finished');
  const allRatings = finished.map(c => c.rating).filter(r => r != null);
  const overallAvg = allRatings.length ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;

  // sentiment buckets
  const satisfied = finished.filter(c => (c.rating || 0) >= 4).length;
  const neutral = finished.filter(c => (c.rating || 0) >= 3 && (c.rating || 0) < 4).length;
  const unsatisfied = finished.filter(c => (c.rating || 0) > 0 && (c.rating || 0) < 3).length;

  // Revenue calculations
  const dealCustomers = finished.filter(c => c.result === 'deal');
  const lostCustomers = finished.filter(c => c.result === 'lost');
  const followupCustomers = finished.filter(c => c.result === 'followup');
  const activeCustomers = store.customers.filter(c => c.status === 'waiting' || c.status === 'serving');

  const realizedRevenue = dealCustomers.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const lostRevenue = lostCustomers.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  // Potential = follow-up (likely-to-close later) + currently active in pipeline
  const followupRevenue = followupCustomers.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const pipelineRevenue = activeCustomers.reduce((sum, c) => sum + (c.dealValue || 0), 0);
  const potentialRevenue = followupRevenue + pipelineRevenue;
  const totalConsideredRevenue = realizedRevenue + lostRevenue + potentialRevenue;
  const winRatePct = (realizedRevenue + lostRevenue) > 0
    ? Math.round((realizedRevenue / (realizedRevenue + lostRevenue)) * 100)
    : 0;

  // deals timeline: 20 buckets x 30s = last 10 minutes
  const BUCKET_SIZE = 30_000;
  const N_BUCKETS = 20;
  const nowMs = Date.now();
  const timeline = [];
  for (let i = N_BUCKETS - 1; i >= 0; i--) {
    const bStart = nowMs - (i + 1) * BUCKET_SIZE;
    const bEnd = nowMs - i * BUCKET_SIZE;
    const inB = finished.filter(c => c.finishedAt >= bStart && c.finishedAt < bEnd);
    const dealsInB = inB.filter(c => c.result === 'deal');
    const lostInB = inB.filter(c => c.result === 'lost');
    timeline.push({
      t: bEnd,
      label: new Date(bEnd).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      deal: dealsInB.length,
      lost: lostInB.length,
      followup: inB.filter(c => c.result === 'followup').length,
      total: inB.length,
      revenueDeal: dealsInB.reduce((s, c) => s + (c.dealValue || 0), 0),
      revenueLost: lostInB.reduce((s, c) => s + (c.dealValue || 0), 0),
    });
  }

  // recent activity feed
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
    timeline,
    stats: {
      waiting: queue.length,
      serving: store.customers.filter(c => c.status === 'serving').length,
      finished: finished.length,
      deal: finished.filter(c => c.result === 'deal').length,
      lost: finished.filter(c => c.result === 'lost').length,
      followup: finished.filter(c => c.result === 'followup').length,
      avgRating: Math.round(overallAvg * 10) / 10,
      ratingCount: allRatings.length,
      satisfied,
      neutral,
      unsatisfied,
      maxLoad: MAX_LOAD,
      realizedRevenue,
      potentialRevenue,
      lostRevenue,
      followupRevenue,
      pipelineRevenue,
      totalConsideredRevenue,
      winRatePct,
    },
  };
}

// Auto-conclude conversation when chat reaches max length
function autoConclude(customer, sales) {  const bias = {
    'Easy Deal': { deal: 0.7, followup: 0.2, lost: 0.1 },
    'Negotiator': { deal: 0.35, followup: 0.30, lost: 0.35 },
    'Many Questions': { deal: 0.30, followup: 0.45, lost: 0.25 },
  }[customer.mood] || { deal: 0.5, followup: 0.3, lost: 0.2 };

  const roll = Math.random();
  let result;
  if (roll < bias.deal) result = 'deal';
  else if (roll < bias.deal + bias.followup) result = 'followup';
  else result = 'lost';

  const closeMsg = {
    deal: ['Oke deal! Saya ambil. Terima kasih kak 🤝', 'Sip, saya beli sekarang!', 'Mantap, langsung proses ya'],
    followup: ['Saya pikir-pikir dulu ya, nanti saya hubungi lagi 📞', 'Boleh saya cek dulu, follow up minggu depan', 'Mau diskusi sama keluarga dulu deh'],
    lost: ['Maaf, saya cancel dulu. Mungkin lain kali.', 'Hmm tidak jadi deh, terima kasih', 'Saya mau bandingkan dulu sama yang lain'],
  }[result];

  if (customer.chat.length < 21) {
    customer.chat.push({
      id: Date.now() + Math.random(),
      from: 'customer',
      author: customer.name,
      text: pick(closeMsg),
      ts: Date.now(),
    });
  }

  customer.status = 'finished';
  customer.result = result;
  customer.finishedAt = Date.now();
  const r = generateRating(customer);
  customer.rating = r.rating;
  customer.feedback = r.feedback;
  // remove from sales' active list
  sales.currentCustomerIds = (sales.currentCustomerIds || []).filter(id => id !== customer.id);
  if (sales.startedAtMap) delete sales.startedAtMap[customer.id];
}

function assignCustomerToSales(sales, customer) {
  if (!sales.currentCustomerIds) sales.currentCustomerIds = [];
  if (!sales.startedAtMap) sales.startedAtMap = {};
  sales.currentCustomerIds.push(customer.id);
  sales.startedAtMap[customer.id] = Date.now();
  customer.status = 'serving';
  customer.servedBy = sales.id;
  customer.startedAt = Date.now();

  // Seed initial chat
  if (!customer.chat) customer.chat = [];
  if (customer.chat.length === 0) {
    const tpl = CHAT_TEMPLATES[customer.mood] || CHAT_TEMPLATES['Easy Deal'];
    const now = Date.now();
    customer.chat.push({
      id: now, from: 'sales', author: sales.name,
      text: `Halo ${customer.name}, selamat datang! Ada yang bisa saya bantu?`, ts: now,
    });
    customer.chat.push({
      id: now + 1, from: 'customer', author: customer.name,
      text: pick(tpl.opener), ts: now + 50,
    });
  }
  return customer;
}

// Compute current avg rating for a sales (default 3.5 if no reviews)
function salesAvgRating(salesId) {
  const served = store.customers.filter(c => c.servedBy === salesId && c.status === 'finished');
  const ratings = served.map(c => c.rating).filter(r => r != null);
  if (!ratings.length) return 3.5;
  return ratings.reduce((a, b) => a + b, 0) / ratings.length;
}

// Smart auto-assign:
// - Premium customer → sales with HIGHEST rating that has capacity (tie-break by lowest load)
// - Normal customer  → sales with LOWEST rating that has capacity (tie-break by lowest load)
// This routes high-value customers to best performers, balances workload on others.
function tryAutoAssign() {
  const assignments = [];
  let next;
  while ((next = getQueue()[0])) {
    const available = store.sales
      .filter(s => (s.currentCustomerIds?.length || 0) < MAX_LOAD)
      .map(s => ({
        s,
        rating: salesAvgRating(s.id),
        load: s.currentCustomerIds?.length || 0,
      }));
    if (available.length === 0) break;

    if (next.type === 'premium') {
      // Highest rating first, then least busy
      available.sort((a, b) => (b.rating - a.rating) || (a.load - b.load));
    } else {
      // Lowest rating first (to give them practice on lower-stakes customers),
      // then least busy
      available.sort((a, b) => (a.rating - b.rating) || (a.load - b.load));
    }
    const chosen = available[0].s;
    assignCustomerToSales(chosen, next);
    assignments.push({ salesId: chosen.id, customerId: next.id, strategy: next.type });
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
      const { salesId, customerId } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      if ((sales.currentCustomerIds?.length || 0) >= MAX_LOAD) {
        return NextResponse.json({ error: `Sales sudah penuh (${MAX_LOAD}/${MAX_LOAD})` }, { status: 400 });
      }
      let customer;
      if (customerId) {
        customer = store.customers.find(c => c.id === customerId && c.status === 'waiting');
        if (!customer) return NextResponse.json({ error: 'Customer tidak tersedia' }, { status: 400 });
      } else {
        customer = getQueue()[0];
        if (!customer) return NextResponse.json({ error: 'Antrean kosong' }, { status: 400 });
      }
      assignCustomerToSales(sales, customer);
      return NextResponse.json({ salesId, customer, snapshot: snapshot() });
    }

    // Manual assign: pick specific customer for specific sales
    if (path === '/assign' && method === 'POST') {
      const { salesId, customerId } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      const customer = store.customers.find(c => c.id === customerId);
      if (!customer) return NextResponse.json({ error: 'Customer tidak ditemukan' }, { status: 404 });
      if (customer.status !== 'waiting') {
        return NextResponse.json({ error: 'Customer tidak dalam antrean' }, { status: 400 });
      }
      if ((sales.currentCustomerIds?.length || 0) >= MAX_LOAD) {
        return NextResponse.json({ error: `Sales sudah penuh (${MAX_LOAD}/${MAX_LOAD})` }, { status: 400 });
      }
      assignCustomerToSales(sales, customer);
      return NextResponse.json({ ok: true, salesId, customerId, snapshot: snapshot() });
    }

    if (path === '/service/finish' && method === 'POST') {
      const { salesId, result } = body;
      let { customerId } = body;
      if (!['deal', 'lost', 'followup'].includes(result)) {
        return NextResponse.json({ error: 'Result harus deal/lost/followup' }, { status: 400 });
      }
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      if (!customerId) {
        customerId = sales.currentCustomerIds?.[0];
      }
      if (!customerId) return NextResponse.json({ error: 'Sales tidak melayani siapa pun' }, { status: 400 });
      const customer = store.customers.find(c => c.id === customerId);
      if (!customer || customer.servedBy !== salesId) {
        return NextResponse.json({ error: 'Customer tidak sedang dilayani oleh sales ini' }, { status: 400 });
      }
      customer.status = 'finished';
      customer.result = result;
      customer.finishedAt = Date.now();
      const r = generateRating(customer);
      customer.rating = r.rating;
      customer.feedback = r.feedback;
      sales.currentCustomerIds = (sales.currentCustomerIds || []).filter(id => id !== customerId);
      if (sales.startedAtMap) delete sales.startedAtMap[customerId];
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

    // Auto-tick: advance ALL ongoing chats (each customer in each sales)
    if (path === '/chat/tick' && method === 'POST') {
      const advances = [];
      const concluded = [];
      for (const s of store.sales) {
        const ids = [...(s.currentCustomerIds || [])];
        for (const cid of ids) {
          const customer = store.customers.find(c => c.id === cid);
          if (!customer || customer.status !== 'serving') continue;
          if (!customer.chat) customer.chat = [];

          const last = customer.chat[customer.chat.length - 1];
          const from = last?.from === 'sales' ? 'customer' : 'sales';
          const text = pickLine(from, customer, customer.chat.length);
          const author = from === 'sales' ? s.name : customer.name;
          const now = Date.now();
          customer.chat.push({ id: now + Math.random(), from, author, text, ts: now });
          advances.push({ salesId: s.id, customerId: customer.id, from, text });

          if (customer.chat.length >= 20) {
            autoConclude(customer, s);
            concluded.push({ salesId: s.id, customerId: customer.id, result: customer.result });
          }
        }
      }
      if (concluded.length > 0) tryAutoAssign();
      return NextResponse.json({ ok: true, advances, concluded, snapshot: snapshot() });
    }

    // CHAT: sales sends a message; customer auto-replies based on mood+phase
    if (path === '/chat/send' && method === 'POST') {
      const { salesId, customerId, text } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      const targetId = customerId || sales.currentCustomerIds?.[0];
      if (!targetId) return NextResponse.json({ error: 'Sales tidak melayani siapa pun' }, { status: 400 });
      const customer = store.customers.find(c => c.id === targetId);
      if (!customer || customer.servedBy !== salesId) {
        return NextResponse.json({ error: 'Customer tidak ditemukan' }, { status: 404 });
      }
      if (!customer.chat) customer.chat = [];

      const trimmed = (text || '').trim();
      const salesText = trimmed || pickLine('sales', customer, customer.chat.length);
      const now = Date.now();
      customer.chat.push({ id: now, from: 'sales', author: sales.name, text: salesText, ts: now });
      customer.chat.push({
        id: now + 1, from: 'customer', author: customer.name,
        text: pickLine('customer', customer, customer.chat.length), ts: now + 100,
      });
      return NextResponse.json({ ok: true, chat: customer.chat });
    }

    if (path === '/chat/quick' && method === 'POST') {
      const { salesId, customerId } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      const targetId = customerId || sales.currentCustomerIds?.[0];
      if (!targetId) return NextResponse.json({ error: 'Sales tidak melayani siapa pun' }, { status: 400 });
      const customer = store.customers.find(c => c.id === targetId);
      if (!customer) return NextResponse.json({ error: 'Customer tidak ditemukan' }, { status: 404 });
      if (!customer.chat) customer.chat = [];
      const now = Date.now();
      customer.chat.push({
        id: now, from: 'sales', author: sales.name,
        text: pickLine('sales', customer, customer.chat.length), ts: now,
      });
      customer.chat.push({
        id: now + 1, from: 'customer', author: customer.name,
        text: pickLine('customer', customer, customer.chat.length), ts: now + 100,
      });
      return NextResponse.json({ ok: true, chat: customer.chat });
    }

    if (path === '/demo/reset' && method === 'POST') {
      store.customers = [];
      store.nextCustomerId = 1;
      store.sales.forEach(s => {
        s.currentCustomerIds = [];
        s.startedAtMap = {};
      });
      return NextResponse.json({ ok: true, snapshot: snapshot() });
    }

    // Add new sales dynamically
    if (path === '/sales/add' && method === 'POST') {
      const { name } = body;
      const id = (store.sales.at(-1)?.id || 0) + 1;
      const letter = String.fromCharCode(64 + id);
      store.sales.push({
        id,
        name: name || `Sales ${letter}`,
        currentCustomerIds: [],
        startedAtMap: {},
      });
      tryAutoAssign();
      return NextResponse.json({ ok: true, snapshot: snapshot() });
    }

    // Remove a sales (only if not busy)
    if (path === '/sales/remove' && method === 'POST') {
      const { salesId } = body;
      const idx = store.sales.findIndex(s => s.id === salesId);
      if (idx === -1) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      if ((store.sales[idx].currentCustomerIds || []).length > 0) {
        return NextResponse.json({ error: 'Sales sedang melayani, tidak bisa dihapus' }, { status: 400 });
      }
      if (store.sales.length <= 1) {
        return NextResponse.json({ error: 'Minimal 1 sales' }, { status: 400 });
      }
      store.sales.splice(idx, 1);
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

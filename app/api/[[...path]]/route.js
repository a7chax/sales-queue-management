import { NextResponse } from 'next/server';

// ============== IN-MEMORY STORE (module-level singleton) ==============
const g = globalThis;
if (!g.__QUEUE_STORE__) {
  g.__QUEUE_STORE__ = {
    customers: [], // {id, name, type, status, createdAt, servedBy, startedAt, finishedAt}
    sales: [
      { id: 1, name: 'Sales A', status: 'available', currentCustomerId: null, startedAt: null },
      { id: 2, name: 'Sales B', status: 'available', currentCustomerId: null, startedAt: null },
      { id: 3, name: 'Sales C', status: 'available', currentCustomerId: null, startedAt: null },
    ],
    nextCustomerId: 1,
  };
}
const store = g.__QUEUE_STORE__;

// ============== HELPERS ==============
function getQueue() {
  const waiting = store.customers.filter(c => c.status === 'waiting');
  // premium first, then FIFO by createdAt
  return waiting.sort((a, b) => {
    if (a.type === b.type) return a.createdAt - b.createdAt;
    return a.type === 'premium' ? -1 : 1;
  });
}

function snapshot() {
  const queue = getQueue();
  const serving = store.customers.filter(c => c.status === 'serving').length;
  const negotiating = store.customers.filter(c => c.status === 'negotiating').length;
  const finished = store.customers.filter(c => c.status === 'finished').length;

  // attach customer details to sales
  const sales = store.sales.map(s => ({
    ...s,
    currentCustomer: s.currentCustomerId
      ? store.customers.find(c => c.id === s.currentCustomerId) || null
      : null,
  }));

  return {
    queue,
    sales,
    customers: store.customers,
    stats: {
      waiting: queue.length,
      serving,
      negotiating,
      finished,
      total: store.customers.length,
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
  sales.status = 'busy';
  sales.currentCustomerId = next.id;
  sales.startedAt = Date.now();
  return next;
}

// ============== ROUTE HANDLERS ==============
async function handle(request, { params }) {
  const segments = (params?.path) || [];
  const path = '/' + segments.join('/');
  const method = request.method;

  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try { body = await request.json(); } catch { body = {}; }
  }

  try {
    // ---- STATUS ----
    if (path === '/status' && method === 'GET') {
      return NextResponse.json(snapshot());
    }

    // ---- CUSTOMERS ----
    if (path === '/customers' && method === 'POST') {
      const { name, type } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
      }
      if (!['premium', 'normal'].includes(type)) {
        return NextResponse.json({ error: 'Tipe harus premium atau normal' }, { status: 400 });
      }
      const customer = {
        id: store.nextCustomerId++,
        name: name.trim(),
        type,
        status: 'waiting',
        createdAt: Date.now(),
        servedBy: null,
        startedAt: null,
        finishedAt: null,
      };
      store.customers.push(customer);
      return NextResponse.json({ customer, snapshot: snapshot() }, { status: 201 });
    }

    if (path === '/customers' && method === 'GET') {
      return NextResponse.json(store.customers);
    }

    // ---- SALES ----
    if (path === '/sales' && method === 'GET') {
      return NextResponse.json(snapshot().sales);
    }

    // ---- START SERVICE ----
    if (path === '/service/start' && method === 'POST') {
      const { salesId } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      if (sales.status !== 'available') {
        return NextResponse.json({ error: 'Sales sedang sibuk' }, { status: 400 });
      }
      const customer = assignNextToSales(sales);
      if (!customer) {
        return NextResponse.json({ error: 'Antrean kosong' }, { status: 400 });
      }
      return NextResponse.json({ salesId, customer, snapshot: snapshot() });
    }

    // ---- FINISH SERVICE ----
    if (path === '/service/finish' && method === 'POST') {
      const { salesId, autoAssign = true } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales) return NextResponse.json({ error: 'Sales tidak ditemukan' }, { status: 404 });
      if (!sales.currentCustomerId) {
        return NextResponse.json({ error: 'Sales tidak sedang melayani' }, { status: 400 });
      }
      const customer = store.customers.find(c => c.id === sales.currentCustomerId);
      if (customer) {
        customer.status = 'finished';
        customer.finishedAt = Date.now();
      }
      sales.status = 'available';
      sales.currentCustomerId = null;
      sales.startedAt = null;

      let next = null;
      if (autoAssign) {
        next = assignNextToSales(sales);
      }
      return NextResponse.json({
        salesId,
        finishedCustomer: customer,
        nextCustomer: next,
        snapshot: snapshot(),
      });
    }

    // ---- MARK NEGOTIATING ----
    if (path === '/service/negotiate' && method === 'POST') {
      const { salesId } = body;
      const sales = store.sales.find(s => s.id === salesId);
      if (!sales || !sales.currentCustomerId) {
        return NextResponse.json({ error: 'Sales tidak melayani siapa pun' }, { status: 400 });
      }
      const customer = store.customers.find(c => c.id === sales.currentCustomerId);
      if (customer) {
        customer.status = customer.status === 'negotiating' ? 'serving' : 'negotiating';
      }
      sales.status = customer?.status === 'negotiating' ? 'negotiating' : 'busy';
      return NextResponse.json({ salesId, customer, snapshot: snapshot() });
    }

    // ---- DEMO ----
    if (path === '/demo/seed' && method === 'POST') {
      const samples = [
        { name: 'Ali Pratama', type: 'premium' },
        { name: 'Dedi Saputra', type: 'normal' },
        { name: 'Ina Maulida', type: 'premium' },
        { name: 'Umar Bakri', type: 'normal' },
        { name: 'Sinta Dewi', type: 'premium' },
      ];
      samples.forEach(s => {
        store.customers.push({
          id: store.nextCustomerId++,
          name: s.name,
          type: s.type,
          status: 'waiting',
          createdAt: Date.now() + store.nextCustomerId,
          servedBy: null,
          startedAt: null,
          finishedAt: null,
        });
      });
      return NextResponse.json({ ok: true, snapshot: snapshot() });
    }

    if (path === '/demo/reset' && method === 'POST') {
      store.customers = [];
      store.nextCustomerId = 1;
      store.sales.forEach(s => {
        s.status = 'available';
        s.currentCustomerId = null;
        s.startedAt = null;
      });
      return NextResponse.json({ ok: true, snapshot: snapshot() });
    }

    if (path === '/sales/add' && method === 'POST') {
      const { name } = body;
      const id = (store.sales.at(-1)?.id || 0) + 1;
      store.sales.push({
        id,
        name: name || `Sales ${String.fromCharCode(64 + id)}`,
        status: 'available',
        currentCustomerId: null,
        startedAt: null,
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

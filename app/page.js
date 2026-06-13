'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Play, CheckCircle2, MessageSquareWarning, RotateCcw, Sparkles,
  Crown, User, Clock, Users, Activity, Trophy, Plus,
} from 'lucide-react';

const api = async (path, opts = {}) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
};

const formatDuration = (ms) => {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

const App = () => {
  const [data, setData] = useState({ queue: [], sales: [], customers: [], stats: { waiting: 0, serving: 0, negotiating: 0, finished: 0 } });
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('normal');

  const refresh = useCallback(async () => {
    const d = await api('/status');
    setData(d);
  }, []);

  useEffect(() => {
    refresh();
    const i = setInterval(refresh, 1500);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(i); clearInterval(t); };
  }, [refresh]);

  const addCustomer = async () => {
    if (!name.trim()) return;
    await api('/customers', { method: 'POST', body: JSON.stringify({ name, type }) });
    setName(''); setType('normal'); setOpen(false);
    refresh();
  };

  const startService = async (salesId) => {
    await api('/service/start', { method: 'POST', body: JSON.stringify({ salesId }) });
    refresh();
  };

  const finishService = async (salesId) => {
    await api('/service/finish', { method: 'POST', body: JSON.stringify({ salesId }) });
    refresh();
  };

  const toggleNegotiate = async (salesId) => {
    await api('/service/negotiate', { method: 'POST', body: JSON.stringify({ salesId }) });
    refresh();
  };

  const seed = async () => {
    await api('/demo/seed', { method: 'POST' });
    refresh();
  };

  const reset = async () => {
    await api('/demo/reset', { method: 'POST' });
    refresh();
  };

  const addSales = async () => {
    await api('/sales/add', { method: 'POST', body: JSON.stringify({}) });
    refresh();
  };

  const { queue, sales, stats } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white shadow-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sales Queue Manager</h1>
              <p className="text-xs text-muted-foreground">Sistem Manajemen Antrean Penjualan • Real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={seed}>
              <Sparkles className="h-4 w-4 mr-2" /> Demo Data
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                  <UserPlus className="h-4 w-4 mr-2" /> Tambah Pelanggan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nama Pelanggan</Label>
                    <Input
                      placeholder="contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomer()}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe Pelanggan</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">
                          <div className="flex items-center gap-2"><User className="h-4 w-4" /> Normal</div>
                        </SelectItem>
                        <SelectItem value="premium">
                          <div className="flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Premium (Prioritas)</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button onClick={addCustomer} className="bg-slate-900 hover:bg-slate-800">Tambah ke Antrean</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Clock} label="Menunggu" value={stats.waiting} color="text-amber-600" bg="bg-amber-50" />
          <StatCard icon={Users} label="Dilayani" value={stats.serving} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={MessageSquareWarning} label="Negosiasi" value={stats.negotiating} color="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={Trophy} label="Selesai" value={stats.finished} color="text-emerald-600" bg="bg-emerald-50" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Queue */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Antrean ({queue.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Tidak ada antrian
                </div>
              ) : (
                <div className="space-y-2">
                  {queue.map((c, idx) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                        c.type === 'premium'
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          c.type === 'premium' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{c.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {c.type === 'premium' ? <><Crown className="h-3 w-3 text-amber-500" /> Premium</> : <><User className="h-3 w-3" /> Normal</>}
                            <span>• {formatDuration(now - c.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Panel */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> Panel Sales ({sales.length})
              </CardTitle>
              <Button size="sm" variant="ghost" onClick={addSales}>
                <Plus className="h-4 w-4 mr-1" /> Tambah Sales
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {sales.map((s) => (
                  <SalesCard
                    key={s.id}
                    sales={s}
                    now={now}
                    queueEmpty={queue.length === 0}
                    onStart={() => startService(s.id)}
                    onFinish={() => finishService(s.id)}
                    onNegotiate={() => toggleNegotiate(s.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-5 w-5 text-emerald-500" /> Riwayat Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.customers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada aktivitas. Klik "Demo Data" untuk mulai.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground border-b">
                    <tr>
                      <th className="py-2">ID</th>
                      <th>Nama</th>
                      <th>Tipe</th>
                      <th>Status</th>
                      <th>Sales</th>
                      <th>Durasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...data.customers].reverse().slice(0, 15).map((c) => {
                      const dur = c.finishedAt && c.startedAt ? c.finishedAt - c.startedAt : (c.startedAt ? now - c.startedAt : null);
                      const salesName = c.servedBy ? sales.find(s => s.id === c.servedBy)?.name : '-';
                      return (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-2 text-muted-foreground">#{c.id}</td>
                          <td className="font-medium">{c.name}</td>
                          <td>
                            {c.type === 'premium'
                              ? <Badge className="bg-amber-500 hover:bg-amber-500"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
                              : <Badge variant="secondary">Normal</Badge>}
                          </td>
                          <td><StatusBadge status={c.status} /></td>
                          <td className="text-muted-foreground">{salesName}</td>
                          <td className="text-muted-foreground">{dur ? formatDuration(dur) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-muted-foreground mt-8 py-4">
          Built with Next.js • In-memory priority queue • Premium customers always prioritized
        </footer>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }) => {
  const map = {
    waiting: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
    serving: { label: 'Dilayani', cls: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
    negotiating: { label: 'Negosiasi', cls: 'bg-purple-100 text-purple-700 hover:bg-purple-100' },
    finished: { label: 'Selesai', cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
  };
  const v = map[status] || { label: status, cls: '' };
  return <Badge className={v.cls} variant="secondary">{v.label}</Badge>;
};

const SalesCard = ({ sales, now, queueEmpty, onStart, onFinish, onNegotiate }) => {
  const c = sales.currentCustomer;
  const isBusy = sales.status !== 'available';
  const isNegotiating = sales.status === 'negotiating';
  const dur = sales.startedAt ? now - sales.startedAt : 0;

  const accentBorder = isNegotiating
    ? 'border-purple-300 bg-purple-50/40'
    : isBusy
      ? 'border-blue-300 bg-blue-50/40'
      : 'border-emerald-200 bg-emerald-50/30';

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${accentBorder}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
            isNegotiating ? 'bg-purple-500' : isBusy ? 'bg-blue-500' : 'bg-emerald-500'
          }`}>
            {sales.name.split(' ').pop()[0]}
          </div>
          <div>
            <div className="font-semibold text-sm">{sales.name}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {sales.status === 'available' ? 'Tersedia' : sales.status === 'negotiating' ? 'Negosiasi' : 'Melayani'}
            </div>
          </div>
        </div>
        {isBusy && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Durasi</div>
            <div className="font-mono text-sm font-semibold">{formatDuration(dur)}</div>
          </div>
        )}
      </div>

      {c ? (
        <div className="mb-3 p-3 rounded-lg bg-white border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {c.type === 'premium' ? <Crown className="h-4 w-4 text-amber-500" /> : <User className="h-4 w-4 text-slate-500" />}
              <span className="font-medium text-sm">{c.name}</span>
            </div>
            <Badge variant="secondary" className={c.type === 'premium' ? 'bg-amber-100 text-amber-700' : ''}>
              {c.type === 'premium' ? 'Premium' : 'Normal'}
            </Badge>
          </div>
        </div>
      ) : (
        <div className="mb-3 p-3 rounded-lg bg-white/50 border border-dashed text-center text-xs text-muted-foreground">
          Tidak ada pelanggan
        </div>
      )}

      <div className="flex gap-2">
        {!isBusy ? (
          <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={onStart} disabled={queueEmpty}>
            <Play className="h-3.5 w-3.5 mr-1" /> Start
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="flex-1" onClick={onNegotiate}>
              <MessageSquareWarning className="h-3.5 w-3.5 mr-1" />
              {isNegotiating ? 'Cancel Nego' : 'Negosiasi'}
            </Button>
            <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={onFinish}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Finish
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

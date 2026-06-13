'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  RadioGroup, RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  UserPlus, Play, CheckCircle2, RotateCcw, Sparkles, Crown,
  Clock, Users, Activity, Trophy, XCircle, Phone, Pause, PlayCircle,
  MessageCircle, Send, Zap, Star, TrendingUp, Award, Radio,
} from 'lucide-react';

const api = async (path, opts = {}) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
};

const formatDuration = (ms) => {
  if (!ms || ms < 0) return '00:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const MOOD_META = {
  'Easy Deal': { emoji: '😊', cls: 'bg-emerald-100 text-emerald-700' },
  'Negotiator': { emoji: '💸', cls: 'bg-amber-100 text-amber-700' },
  'Many Questions': { emoji: '❓', cls: 'bg-blue-100 text-blue-700' },
};

const RESULT_META = {
  deal: { label: 'Deal', icon: CheckCircle2, cls: 'text-emerald-600', bg: 'bg-emerald-50' },
  lost: { label: 'Lost', icon: XCircle, cls: 'text-rose-600', bg: 'bg-rose-50' },
  followup: { label: 'Follow Up', icon: Phone, cls: 'text-blue-600', bg: 'bg-blue-50' },
};

const App = () => {
  const [data, setData] = useState({
    queue: [], sales: [], customers: [], history: [], activity: [],
    stats: { waiting: 0, serving: 0, finished: 0, deal: 0, lost: 0, followup: 0, avgRating: 0, ratingCount: 0 },
  });
  const [now, setNow] = useState(Date.now());
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('normal');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [finishSales, setFinishSales] = useState(null);
  const [finishResult, setFinishResult] = useState('deal');
  const [autoGen, setAutoGen] = useState(true);
  const [autoChat, setAutoChat] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSalesId, setChatSalesId] = useState(null);
  const [chatInput, setChatInput] = useState('');

  const refresh = useCallback(async () => {
    const d = await api('/status');
    setData(d);
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 1500);
    const ticker = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(poll); clearInterval(ticker); };
  }, [refresh]);

  // Auto-generate customer every 10 seconds
  const autoGenRef = useRef(autoGen);
  autoGenRef.current = autoGen;
  useEffect(() => {
    const i = setInterval(async () => {
      if (autoGenRef.current) {
        await api('/demo/random', { method: 'POST' });
        refresh();
      }
    }, 10000);
    return () => clearInterval(i);
  }, [refresh]);

  // Auto-chat tick every ~4 seconds to advance ongoing conversations
  const autoChatRef = useRef(autoChat);
  autoChatRef.current = autoChat;
  useEffect(() => {
    const i = setInterval(async () => {
      if (autoChatRef.current) {
        await api('/chat/tick', { method: 'POST' });
        refresh();
      }
    }, 4000);
    return () => clearInterval(i);
  }, [refresh]);

  const addCustomer = async () => {
    if (!name.trim()) return;
    await api('/customers', { method: 'POST', body: JSON.stringify({ name, type }) });
    setName(''); setType('normal'); setAddOpen(false);
    refresh();
  };

  const startService = async (salesId) => {
    await api('/service/start', { method: 'POST', body: JSON.stringify({ salesId }) });
    refresh();
  };

  const openFinish = (sales) => {
    setFinishSales(sales);
    setFinishResult('deal');
    setFinishOpen(true);
  };

  const confirmFinish = async () => {
    await api('/service/finish', {
      method: 'POST',
      body: JSON.stringify({ salesId: finishSales.id, result: finishResult }),
    });
    setFinishOpen(false);
    setFinishSales(null);
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

  const openDetail = (customer) => {
    setDetailCustomer(customer);
    setDetailOpen(true);
  };

  const openChat = (salesId) => {
    setChatSalesId(salesId);
    setChatInput('');
    setChatOpen(true);
  };

  const sendChat = async () => {
    if (!chatSalesId) return;
    const text = chatInput.trim();
    await api('/chat/send', { method: 'POST', body: JSON.stringify({ salesId: chatSalesId, text }) });
    setChatInput('');
    refresh();
  };

  const quickChat = async () => {
    if (!chatSalesId) return;
    await api('/chat/quick', { method: 'POST', body: JSON.stringify({ salesId: chatSalesId }) });
    refresh();
  };

  const { queue, sales, stats, history } = data;
  const chatSales = sales.find(s => s.id === chatSalesId) || null;
  const chatCustomer = chatSales?.currentCustomer || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white shadow-lg">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sales Queue Manager</h1>
              <p className="text-xs text-muted-foreground">Hackathon MVP • Auto-generate every 10s</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={autoGen ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoGen(!autoGen)}
              className={autoGen ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            >
              {autoGen ? <Pause className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              Auto-Gen: {autoGen ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant={autoChat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoChat(!autoChat)}
              className={autoChat ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Auto-Chat: {autoChat ? 'ON' : 'OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={seed}>
              <Sparkles className="h-4 w-4 mr-2" /> Demo Data
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
                  <UserPlus className="h-4 w-4 mr-2" /> Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input
                      placeholder="contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomer()}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">🙂 Normal</SelectItem>
                        <SelectItem value="premium">👑 Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Mood akan di-generate otomatis (Easy Deal / Negotiator / Many Questions).</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                  <Button onClick={addCustomer} className="bg-slate-900 hover:bg-slate-800">Tambah</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={Clock} label="Waiting" value={stats.waiting} color="text-amber-600" bg="bg-amber-50" />
          <StatCard icon={Users} label="Serving" value={stats.serving} color="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={CheckCircle2} label="Deal" value={stats.deal} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard icon={XCircle} label="Lost" value={stats.lost} color="text-rose-600" bg="bg-rose-50" />
          <StatCard icon={Phone} label="Follow Up" value={stats.followup} color="text-blue-600" bg="bg-blue-50" />
          <StatCard
            icon={Star}
            label="Avg Rating"
            value={stats.avgRating ? `${stats.avgRating} ⭐` : '—'}
            sub={stats.ratingCount ? `${stats.ratingCount} reviews` : 'no reviews'}
            color="text-yellow-600"
            bg="bg-yellow-50"
          />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Queue */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" /> Waiting Queue ({queue.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queue.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  Tidak ada antrian
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {queue.map((c, idx) => {
                    const mm = MOOD_META[c.mood] || {};
                    return (
                      <button
                        key={c.id}
                        onClick={() => openDetail(c)}
                        className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-all hover:shadow-md ${
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
                            <div className="font-medium text-sm flex items-center gap-1">
                              {c.type === 'premium' ? '👑' : '🙂'} {c.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <span>{c.type === 'premium' ? 'Premium' : 'Normal'}</span>
                              <span>•</span>
                              <span>{mm.emoji} {c.mood}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {formatDuration(now - c.createdAt)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Panel */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> Sales Panel
              </CardTitle>
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
                    onFinish={() => openFinish(s)}
                    onChat={() => openChat(s.id)}
                    onCustomerClick={openDetail}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500" /> History ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Belum ada history.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.slice(0, 12).map((c) => {
                  const r = RESULT_META[c.result] || RESULT_META.lost;
                  const Icon = r.icon;
                  const dur = c.finishedAt && c.startedAt ? c.finishedAt - c.startedAt : 0;
                  return (
                    <div key={c.id} className={`p-3 rounded-lg border ${r.bg}`}>
                      <div className="flex items-center gap-3">
                        <Icon className={`h-6 w-6 ${r.cls} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {c.type === 'premium' ? '👑' : '🙂'} {c.name}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className={`font-semibold ${r.cls}`}>{r.label}</span>
                            <span>• {formatDuration(dur)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <StarRating value={c.rating} />
                      </div>
                      {c.feedback && (
                        <div className="mt-1 text-[11px] italic text-slate-600 truncate" title={c.feedback}>
                          "{c.feedback}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales Leaderboard + Live Activity */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" /> Sales Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...sales]
                  .sort((a, b) => (b.stats?.avgRating || 0) - (a.stats?.avgRating || 0) || (b.stats?.deals || 0) - (a.stats?.deals || 0))
                  .map((s, idx) => {
                    const st = s.stats || {};
                    const closeRate = st.served ? Math.round((st.deals / st.served) * 100) : 0;
                    return (
                      <div key={s.id} className="p-3 rounded-lg border bg-slate-50/50 flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-white ${
                          idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-slate-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm">{s.name}</div>
                            <StarRating value={st.avgRating || null} />
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>👥 {st.served || 0} served</span>
                            <span className="text-emerald-600">✓ {st.deals || 0} deal</span>
                            <span className="text-rose-600">✗ {st.lost || 0}</span>
                            <span className="text-blue-600">📞 {st.followup || 0}</span>
                            <span className="ml-auto font-semibold text-slate-700">
                              {closeRate}% close
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-rose-500 animate-pulse" />
                Live Activity Feed
                {autoChat && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">LIVE</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Belum ada percakapan.</p>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {data.activity.map((m) => (
                    <div key={m.id} className={`p-2 rounded-lg text-xs border-l-4 ${
                      m.from === 'sales' ? 'border-blue-400 bg-blue-50/50' : 'border-amber-400 bg-amber-50/50'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-semibold">
                          {m.from === 'sales' ? '💼' : (m.customerType === 'premium' ? '👑' : '🙂')} {m.author}
                          <span className="text-muted-foreground/60"> → {m.from === 'sales' ? m.customerName : 'Sales'}</span>
                        </span>
                        <span>{new Date(m.ts).toLocaleTimeString('id-ID', { hour12: false })}</span>
                      </div>
                      <div className="mt-0.5 text-slate-700">{m.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <footer className="text-center text-xs text-muted-foreground mt-8 py-4">
          Built with Next.js • In-memory priority queue • Premium first • Auto-gen tiap 10 detik
        </footer>
      </main>

      {/* Customer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {detailCustomer?.type === 'premium' ? '👑' : '🙂'} {detailCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {detailCustomer && (
            <div className="space-y-3 py-2">
              <DetailRow label="Type" value={
                <Badge className={detailCustomer.type === 'premium' ? 'bg-amber-500 hover:bg-amber-500' : ''} variant={detailCustomer.type === 'premium' ? 'default' : 'secondary'}>
                  {detailCustomer.type === 'premium' ? <><Crown className="h-3 w-3 mr-1" /> Premium</> : 'Normal'}
                </Badge>
              } />
              <DetailRow label="Mood" value={
                <Badge variant="secondary" className={MOOD_META[detailCustomer.mood]?.cls}>
                  {MOOD_META[detailCustomer.mood]?.emoji} {detailCustomer.mood}
                </Badge>
              } />
              <DetailRow label="Status" value={<StatusBadge status={detailCustomer.status} />} />
              {detailCustomer.result && (
                <DetailRow label="Result" value={
                  <span className={`font-semibold ${RESULT_META[detailCustomer.result]?.cls}`}>
                    {RESULT_META[detailCustomer.result]?.label}
                  </span>
                } />
              )}
              {detailCustomer.rating != null && (
                <DetailRow label="Rating" value={<StarRating value={detailCustomer.rating} size={16} />} />
              )}
              {detailCustomer.feedback && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm italic text-slate-700">
                  💬 "{detailCustomer.feedback}"
                </div>
              )}
              <DetailRow label="Waktu Masuk" value={
                <span className="text-sm text-muted-foreground">
                  {new Date(detailCustomer.createdAt).toLocaleTimeString('id-ID')}
                </span>
              } />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Chat: {chatSales?.name}
              {chatCustomer && (
                <span className="text-sm font-normal text-muted-foreground">
                  ↔ {chatCustomer.type === 'premium' ? '👑' : '🙂'} {chatCustomer.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {chatCustomer ? (
            <>
              <div className="text-xs text-muted-foreground -mt-2 flex items-center gap-1">
                Mood: <Badge variant="secondary" className={MOOD_META[chatCustomer.mood]?.cls}>
                  {MOOD_META[chatCustomer.mood]?.emoji} {chatCustomer.mood}
                </Badge>
              </div>
              <div className="h-80 overflow-y-auto bg-slate-50 rounded-lg p-3 space-y-2 border">
                {(chatCustomer.chat || []).length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">Belum ada percakapan</p>
                )}
                {(chatCustomer.chat || []).map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'sales' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === 'sales'
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white border rounded-bl-sm'
                    }`}>
                      <div className={`text-[10px] mb-0.5 ${m.from === 'sales' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                        {m.author}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ketik pesan sebagai sales..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                />
                <Button size="icon" onClick={sendChat} disabled={!chatInput.trim()} className="bg-blue-500 hover:bg-blue-600">
                  <Send className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={quickChat} title="Quick reply (auto)">
                  <Zap className="h-4 w-4 text-amber-500" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground -mt-2">
                💡 Tekan ⚡ untuk auto-reply. Customer akan otomatis membalas sesuai mood-nya.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Sales belum melayani siapa pun.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Finish Dialog */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Finish Service</DialogTitle></DialogHeader>
          {finishSales && (
            <div className="space-y-4 py-2">
              <p className="text-sm">
                <span className="text-muted-foreground">{finishSales.name} melayani:</span>{' '}
                <span className="font-semibold">
                  {finishSales.currentCustomer?.type === 'premium' ? '👑' : '🙂'}{' '}
                  {finishSales.currentCustomer?.name}
                </span>
              </p>
              <RadioGroup value={finishResult} onValueChange={setFinishResult} className="space-y-2">
                <FinishOption value="deal" current={finishResult} icon={CheckCircle2} label="Deal" color="emerald" />
                <FinishOption value="lost" current={finishResult} icon={XCircle} label="Lost" color="rose" />
                <FinishOption value="followup" current={finishResult} icon={Phone} label="Follow Up" color="blue" />
              </RadioGroup>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinishOpen(false)}>Batal</Button>
            <Button onClick={confirmFinish} className="bg-slate-900 hover:bg-slate-800">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, bg }) => (
  <Card className="shadow-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-xl font-bold truncate">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
      </div>
    </CardContent>
  </Card>
);

const StarRating = ({ value, size = 14 }) => {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full;
        const isHalf = !filled && i === full + 1 && half;
        return (
          <Star
            key={i}
            size={size}
            className={filled ? 'fill-yellow-400 text-yellow-400' : isHalf ? 'fill-yellow-200 text-yellow-400' : 'text-slate-300'}
          />
        );
      })}
      <span className="ml-1 text-xs font-medium text-muted-foreground">{value}</span>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    waiting: { label: 'Waiting', cls: 'bg-amber-100 text-amber-700' },
    serving: { label: 'Being Served', cls: 'bg-blue-100 text-blue-700' },
    finished: { label: 'Finished', cls: 'bg-emerald-100 text-emerald-700' },
  };
  const v = map[status] || { label: status, cls: '' };
  return <Badge className={v.cls} variant="secondary">{v.label}</Badge>;
};

const DetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between border-b pb-2 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div>{value}</div>
  </div>
);

const FinishOption = ({ value, current, icon: Icon, label, color }) => {
  const active = current === value;
  const colorMap = {
    emerald: 'border-emerald-300 bg-emerald-50',
    rose: 'border-rose-300 bg-rose-50',
    blue: 'border-blue-300 bg-blue-50',
  };
  const iconColorMap = {
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    blue: 'text-blue-600',
  };
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
      active ? colorMap[color] : 'border-slate-200 hover:bg-slate-50'
    }`}>
      <RadioGroupItem value={value} id={value} />
      <Icon className={`h-5 w-5 ${iconColorMap[color]}`} />
      <span className="font-medium">{label}</span>
    </label>
  );
};

const SalesCard = ({ sales, now, queueEmpty, onStart, onFinish, onChat, onCustomerClick }) => {
  const c = sales.currentCustomer;
  const isBusy = !!c;
  const dur = sales.startedAt ? now - sales.startedAt : 0;
  const mm = c ? MOOD_META[c.mood] || {} : {};
  const chatCount = c?.chat?.length || 0;

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      isBusy ? 'border-blue-300 bg-blue-50/40' : 'border-emerald-200 bg-emerald-50/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
            isBusy ? 'bg-blue-500' : 'bg-emerald-500'
          }`}>
            {sales.name.split(' ').pop()[0]}
          </div>
          <div>
            <div className="font-semibold text-sm">{sales.name}</div>
            <div className="text-xs text-muted-foreground">
              {isBusy ? 'Serving' : 'Available'}
            </div>
          </div>
        </div>
        {isBusy && (
          <div className="text-right">
            <div className="text-xs text-muted-foreground">⏱</div>
            <div className="font-mono text-sm font-semibold">{formatDuration(dur)}</div>
          </div>
        )}
      </div>

      {c ? (
        <button
          onClick={() => onCustomerClick(c)}
          className="w-full mb-3 p-3 rounded-lg bg-white border text-left hover:shadow transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">
              {c.type === 'premium' ? '👑' : '🙂'} {c.name}
            </div>
            <Badge variant="secondary" className={c.type === 'premium' ? 'bg-amber-100 text-amber-700' : ''}>
              {c.type === 'premium' ? 'Premium' : 'Normal'}
            </Badge>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Mood: {mm.emoji} {c.mood}
          </div>
        </button>
      ) : (
        <div className="mb-3 p-3 rounded-lg bg-white/50 border border-dashed text-center text-xs text-muted-foreground">
          Tidak ada pelanggan
        </div>
      )}

      {!isBusy ? (
        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={onStart} disabled={queueEmpty}>
          <Play className="h-3.5 w-3.5 mr-1" /> Start Customer
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" onClick={onChat} className="relative">
            <MessageCircle className="h-3.5 w-3.5 mr-1" /> Chat
            {chatCount > 0 && (
              <span className="ml-1 bg-blue-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                {chatCount}
              </span>
            )}
          </Button>
          <Button size="sm" className="bg-slate-900 hover:bg-slate-800" onClick={onFinish}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Finish
          </Button>
        </div>
      )}
    </div>
  );
};

export default App;

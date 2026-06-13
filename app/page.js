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
  ArrowRight, Smile, Meh, Frown, BarChart3, Heart,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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

const formatMs = (ms) => {
  if (!ms || ms <= 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
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
    queue: [], sales: [], customers: [], history: [], activity: [], timeline: [],
    stats: { waiting: 0, serving: 0, finished: 0, deal: 0, lost: 0, followup: 0, avgRating: 0, ratingCount: 0, satisfied: 0, neutral: 0, unsatisfied: 0 },
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
  const [chatCustomerId, setChatCustomerId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  // View chat from history (read-only)
  const [viewChatOpen, setViewChatOpen] = useState(false);
  const [viewChatCustomer, setViewChatCustomer] = useState(null);
  // History filters
  const [filterResult, setFilterResult] = useState('all');
  const [filterSales, setFilterSales] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');

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
    }, 2500);
    return () => clearInterval(i);
  }, [refresh]);

  const addCustomer = async () => {
    if (!name.trim()) return;
    await api('/customers', { method: 'POST', body: JSON.stringify({ name, type }) });
    setName(''); setType('normal'); setAddOpen(false);
    refresh();
  };

  const startService = async (salesId, customerId) => {
    await api('/service/start', { method: 'POST', body: JSON.stringify({ salesId, customerId }) });
    refresh();
  };

  const manualAssign = async (salesId, customerId) => {
    await api('/assign', { method: 'POST', body: JSON.stringify({ salesId, customerId }) });
    refresh();
  };

  const openFinish = (sales, customer) => {
    setFinishSales({ ...sales, _targetCustomer: customer });
    setFinishResult('deal');
    setFinishOpen(true);
  };

  const confirmFinish = async () => {
    const target = finishSales?._targetCustomer;
    await api('/service/finish', {
      method: 'POST',
      body: JSON.stringify({ salesId: finishSales.id, customerId: target?.id, result: finishResult }),
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

  const addSales = async () => {
    await api('/sales/add', { method: 'POST', body: JSON.stringify({}) });
    refresh();
  };

  const removeSales = async (salesId) => {
    await api('/sales/remove', { method: 'POST', body: JSON.stringify({ salesId }) });
    refresh();
  };

  const openChat = (salesId, customerId) => {
    setChatSalesId(salesId);
    setChatCustomerId(customerId);
    setChatInput('');
    setChatOpen(true);
  };

  const sendChat = async () => {
    if (!chatSalesId || !chatCustomerId) return;
    const text = chatInput.trim();
    await api('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ salesId: chatSalesId, customerId: chatCustomerId, text }),
    });
    setChatInput('');
    refresh();
  };

  const quickChat = async () => {
    if (!chatSalesId || !chatCustomerId) return;
    await api('/chat/quick', {
      method: 'POST',
      body: JSON.stringify({ salesId: chatSalesId, customerId: chatCustomerId }),
    });
    refresh();
  };

  const { queue, sales, stats, history, timeline } = data;
  const chatSales = sales.find(s => s.id === chatSalesId) || null;
  const chatCustomer = chatSales?.currentCustomers?.find(c => c.id === chatCustomerId) || null;

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

        {/* Sentiment + Timeline Chart */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <SentimentCard stats={stats} />
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Deals Timeline
                <span className="text-xs font-normal text-muted-foreground">(last 10 min, 30s buckets)</span>
                <div className="ml-auto flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500" /> Deal</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-500" /> Lost</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500" /> Follow Up</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DealsTimeline timeline={timeline} />
            </CardContent>
          </Card>
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
                      <div
                        key={c.id}
                        className={`group p-3 rounded-lg border flex items-center justify-between transition-all hover:shadow-md ${
                          c.type === 'premium'
                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => openDetail(c)}
                          className="flex items-center gap-3 text-left flex-1 min-w-0"
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            c.type === 'premium' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm flex items-center gap-1 truncate">
                              {c.type === 'premium' ? '👑' : '🙂'} {c.name}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2 truncate">
                              <span>{c.type === 'premium' ? 'Premium' : 'Normal'}</span>
                              <span>•</span>
                              <span>{mm.emoji} {c.mood}</span>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-muted-foreground font-mono mr-1">
                            {formatDuration(now - c.createdAt)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs opacity-70 group-hover:opacity-100"
                              >
                                <ArrowRight className="h-3 w-3 mr-1" /> Assign
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel className="text-xs">Pilih Sales untuk {c.name}</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {sales.map((s) => {
                                const full = s.load >= s.capacity;
                                return (
                                  <DropdownMenuItem
                                    key={s.id}
                                    disabled={full}
                                    onClick={() => manualAssign(s.id, c.id)}
                                    className="text-xs"
                                  >
                                    <span className="font-medium">{s.name}</span>
                                    <span className={`ml-auto text-[10px] ${full ? 'text-rose-500' : 'text-emerald-600'}`}>
                                      {s.load}/{s.capacity} {full ? '(full)' : ''}
                                    </span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sales Panel */}
          <Card className="lg:col-span-3 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" /> Sales Panel ({sales.length})
              </CardTitle>
              <Button size="sm" variant="outline" onClick={addSales}>
                <UserPlus className="h-4 w-4 mr-1" /> Tambah Sales
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
                    onFinish={(c) => openFinish(s, c)}
                    onChat={(c) => openChat(s.id, c.id)}
                    onCustomerClick={openDetail}
                    onRemove={() => removeSales(s.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Table with Filters */}
        <Card className="mt-6 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 flex-wrap">
              <Trophy className="h-5 w-5 text-emerald-500" />
              History
              <Badge variant="secondary" className="text-[10px]">{history.length} total</Badge>
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                <Input
                  placeholder="Cari nama..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="h-8 w-44 text-xs"
                />
                <Select value={filterResult} onValueChange={setFilterResult}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Result</SelectItem>
                    <SelectItem value="deal">✓ Deal</SelectItem>
                    <SelectItem value="lost">✗ Lost</SelectItem>
                    <SelectItem value="followup">📞 Follow Up</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSales} onValueChange={setFilterSales}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Sales</SelectItem>
                    {sales.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Rating</SelectItem>
                    <SelectItem value="high">😊 ≥ 4 ⭐</SelectItem>
                    <SelectItem value="mid">😐 3 - 4 ⭐</SelectItem>
                    <SelectItem value="low">😞 &lt; 3 ⭐</SelectItem>
                  </SelectContent>
                </Select>
                {(filterResult !== 'all' || filterSales !== 'all' || filterRating !== 'all' || filterSearch) && (
                  <Button variant="ghost" size="sm" className="h-8 text-xs"
                    onClick={() => { setFilterResult('all'); setFilterSales('all'); setFilterRating('all'); setFilterSearch(''); }}>
                    <XCircle className="h-3 w-3 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HistoryTable
              history={history}
              sales={sales}
              filterResult={filterResult}
              filterSales={filterSales}
              filterRating={filterRating}
              filterSearch={filterSearch}
              onView={(c) => { setViewChatCustomer(c); setViewChatOpen(true); }}
            />
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
                    const resp = st.avgResponseMs || 0;
                    const respColor = resp === 0 ? 'text-slate-400'
                      : resp < 1500 ? 'text-emerald-600'
                      : resp < 3000 ? 'text-amber-600'
                      : 'text-rose-600';
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
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span>👥 {st.served || 0}</span>
                            <span className="text-emerald-600">✓ {st.deals || 0}</span>
                            <span className="text-rose-600">✗ {st.lost || 0}</span>
                            <span className="text-blue-600">📞 {st.followup || 0}</span>
                            <span className={`flex items-center gap-1 font-medium ${respColor}`}>
                              ⚡ {formatMs(resp)}
                            </span>
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

        {/* Testimonials Wall */}
        <Card className="shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-400" />
              Testimoni Customer
              {(() => {
                const positives = history.filter(c => (c.rating || 0) >= 4);
                return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">
                  {positives.length} positif
                </Badge>;
              })()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.filter(c => c.feedback).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada testimoni.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {history.filter(c => c.feedback).slice(0, 9).map((c) => {
                  const salesName = sales.find(s => s.id === c.servedBy)?.name || 'Sales';
                  const bgGrad = c.rating >= 4.5
                    ? 'from-amber-50 to-yellow-50 border-amber-200'
                    : c.rating >= 3.5
                      ? 'from-blue-50 to-sky-50 border-blue-200'
                      : c.rating >= 2.5
                        ? 'from-slate-50 to-gray-50 border-slate-200'
                        : 'from-rose-50 to-pink-50 border-rose-200';
                  return (
                    <div key={c.id} className={`rounded-xl border bg-gradient-to-br ${bgGrad} p-4 relative`}>
                      <div className="absolute top-3 right-3 text-3xl opacity-20">"</div>
                      <StarRating value={c.rating} size={14} />
                      <p className="mt-2 text-sm italic text-slate-700 leading-relaxed">
                        "{c.feedback}"
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/60 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            c.type === 'premium' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
                          }`}>
                            {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {c.type === 'premium' ? '👑' : '🙂'} {c.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate">
                              Dilayani oleh {salesName}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] flex-shrink-0 ${RESULT_META[c.result]?.bg} ${RESULT_META[c.result]?.cls}`}
                        >
                          {RESULT_META[c.result]?.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

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

      {/* View Chat (read-only history) Dialog */}
      <Dialog open={viewChatOpen} onOpenChange={setViewChatOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              Chat History
            </DialogTitle>
          </DialogHeader>
          {viewChatCustomer && (
            <>
              <div className="flex items-center justify-between text-xs -mt-2">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">
                    {viewChatCustomer.type === 'premium' ? '👑' : '🙂'} {viewChatCustomer.name}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <Badge variant="secondary" className={MOOD_META[viewChatCustomer.mood]?.cls}>
                    {MOOD_META[viewChatCustomer.mood]?.emoji} {viewChatCustomer.mood}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={viewChatCustomer.rating} size={12} />
                  <Badge variant="secondary" className={`${RESULT_META[viewChatCustomer.result]?.bg} ${RESULT_META[viewChatCustomer.result]?.cls}`}>
                    {RESULT_META[viewChatCustomer.result]?.label}
                  </Badge>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground -mt-1">
                Avg response: <strong>{formatMs(viewChatCustomer.avgResponseMs)}</strong>
                {' • '}Duration: <strong>{formatDuration((viewChatCustomer.finishedAt || 0) - (viewChatCustomer.startedAt || 0))}</strong>
                {' • '}{viewChatCustomer.chat?.length || 0} messages
              </div>
              <div className="h-80 overflow-y-auto bg-slate-50 rounded-lg p-3 space-y-2 border">
                {(viewChatCustomer.chat || []).length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-8">Tidak ada chat</p>
                ) : (viewChatCustomer.chat || []).map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'sales' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      m.from === 'sales'
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-white border rounded-bl-sm'
                    }`}>
                      <div className={`text-[10px] mb-0.5 ${m.from === 'sales' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                        {m.author} • {new Date(m.ts).toLocaleTimeString('id-ID', { hour12: false })}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  </div>
                ))}
              </div>
              {viewChatCustomer.feedback && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs italic text-slate-700">
                  💬 "{viewChatCustomer.feedback}"
                </div>
              )}
            </>
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

const SalesCard = ({ sales, now, queueEmpty, onStart, onFinish, onChat, onCustomerClick, onRemove }) => {
  const customers = sales.currentCustomers || [];
  const load = sales.load || 0;
  const cap = sales.capacity || 3;
  const isFull = load >= cap;
  const isIdle = load === 0;
  const loadPct = Math.round((load / cap) * 100);

  const borderColor = isIdle
    ? 'border-emerald-200 bg-emerald-50/30'
    : isFull
      ? 'border-rose-300 bg-rose-50/30'
      : 'border-blue-300 bg-blue-50/40';

  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
            isIdle ? 'bg-emerald-500' : isFull ? 'bg-rose-500' : 'bg-blue-500'
          }`}>
            {sales.name.split(' ').pop()[0]}
          </div>
          <div>
            <div className="font-semibold text-sm">{sales.name}</div>
            <div className="text-xs text-muted-foreground">
              {isIdle ? 'Idle' : isFull ? 'Full' : 'Serving'} • ⭐ {sales.stats?.avgRating || '—'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase">Load</div>
          <div className="font-mono text-sm font-semibold">{load}/{cap}</div>
        </div>
      </div>

      {/* Load bar */}
      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all ${
            isFull ? 'bg-rose-500' : load > 0 ? 'bg-blue-500' : 'bg-slate-300'
          }`}
          style={{ width: `${loadPct}%` }}
        />
      </div>

      {customers.length === 0 ? (
        <div className="mb-3 p-3 rounded-lg bg-white/50 border border-dashed text-center text-xs text-muted-foreground">
          Tidak ada pelanggan
        </div>
      ) : (
        <div className="space-y-2 mb-3">
          {customers.map((c) => {
            const mm = MOOD_META[c.mood] || {};
            const startedAt = sales.startedAtMap?.[c.id] || c.startedAt;
            const dur = startedAt ? now - startedAt : 0;
            const chatCount = c.chat?.length || 0;
            return (
              <div key={c.id} className="p-2 rounded-lg bg-white border">
                <button
                  onClick={() => onCustomerClick(c)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-xs truncate">
                      {c.type === 'premium' ? '👑' : '🙂'} {c.name}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="font-mono text-[10px] text-muted-foreground">{formatDuration(dur)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {mm.emoji} {c.mood} • {chatCount} msg
                  </div>
                </button>
                <div className="grid grid-cols-2 gap-1 mt-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onChat(c)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                  <Button size="sm" className="h-7 text-xs bg-slate-900 hover:bg-slate-800" onClick={() => onFinish(c)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Finish
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="outline"
          className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          onClick={onStart}
          disabled={queueEmpty || isFull}
        >
          <Play className="h-3.5 w-3.5 mr-1" /> Take Next
        </Button>
        <Button size="sm" variant="ghost" className="text-rose-500 hover:bg-rose-50" onClick={onRemove} disabled={!isIdle}>
          <XCircle className="h-3.5 w-3.5 mr-1" /> Remove
        </Button>
      </div>
    </div>
  );
};

const HistoryTable = ({ history, sales, filterResult, filterSales, filterRating, filterSearch, onView }) => {
  const filtered = history.filter((c) => {
    if (filterResult !== 'all' && c.result !== filterResult) return false;
    if (filterSales !== 'all' && String(c.servedBy) !== filterSales) return false;
    if (filterRating === 'high' && (c.rating || 0) < 4) return false;
    if (filterRating === 'mid' && ((c.rating || 0) < 3 || (c.rating || 0) >= 4)) return false;
    if (filterRating === 'low' && ((c.rating || 0) === 0 || (c.rating || 0) >= 3)) return false;
    if (filterSearch && !c.name.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-muted-foreground">
        {history.length === 0 ? 'Belum ada history.' : 'Tidak ada data sesuai filter.'}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="w-12 text-xs">#</TableHead>
            <TableHead className="text-xs">Customer</TableHead>
            <TableHead className="text-xs">Mood</TableHead>
            <TableHead className="text-xs">Sales</TableHead>
            <TableHead className="text-xs">Result</TableHead>
            <TableHead className="text-xs">Rating</TableHead>
            <TableHead className="text-xs">Duration</TableHead>
            <TableHead className="text-xs">Avg Reply</TableHead>
            <TableHead className="text-xs">Feedback</TableHead>
            <TableHead className="text-xs w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.slice(0, 50).map((c) => {
            const sname = sales.find(s => s.id === c.servedBy)?.name || '—';
            const r = RESULT_META[c.result] || RESULT_META.lost;
            const dur = c.finishedAt && c.startedAt ? c.finishedAt - c.startedAt : 0;
            return (
              <TableRow key={c.id} className="text-xs hover:bg-slate-50">
                <TableCell className="text-muted-foreground">#{c.id}</TableCell>
                <TableCell className="font-medium">
                  {c.type === 'premium' ? '👑' : '🙂'} {c.name}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${MOOD_META[c.mood]?.cls} text-[10px]`}>
                    {MOOD_META[c.mood]?.emoji} {c.mood}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{sname}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${r.bg} ${r.cls} text-[10px]`}>
                    {r.label}
                  </Badge>
                </TableCell>
                <TableCell><StarRating value={c.rating} size={11} /></TableCell>
                <TableCell className="font-mono text-[11px]">{formatDuration(dur)}</TableCell>
                <TableCell className="font-mono text-[11px]">
                  <span className={(c.avgResponseMs || 0) < 1000 ? 'text-emerald-600' : (c.avgResponseMs || 0) < 3000 ? 'text-amber-600' : 'text-rose-600'}>
                    {formatMs(c.avgResponseMs)}
                  </span>
                </TableCell>
                <TableCell className="text-[11px] italic text-muted-foreground max-w-[180px] truncate" title={c.feedback}>
                  {c.feedback ? `"${c.feedback}"` : '—'}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onView(c)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Chat
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {filtered.length > 50 && (
        <p className="text-[10px] text-muted-foreground text-center py-2 border-t">
          Menampilkan 50 dari {filtered.length} hasil
        </p>
      )}
    </div>
  );
};

const SentimentCard = ({ stats }) => {
  const total = (stats.satisfied || 0) + (stats.neutral || 0) + (stats.unsatisfied || 0);
  const sPct = total ? Math.round((stats.satisfied / total) * 100) : 0;
  const nPct = total ? Math.round((stats.neutral / total) * 100) : 0;
  const uPct = total ? 100 - sPct - nPct : 0;
  const score = stats.avgRating || 0;
  const scoreColor = score >= 4 ? 'text-emerald-600' : score >= 3 ? 'text-amber-600' : score > 0 ? 'text-rose-600' : 'text-slate-400';

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
          Sentimen Pelanggan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 mb-3">
          <div className={`text-3xl font-bold ${scoreColor}`}>{score || '—'}</div>
          <div className="text-xs text-muted-foreground">/ 5.0 dari {total} review</div>
        </div>
        {/* Combined progress bar */}
        <div className="h-2.5 rounded-full overflow-hidden flex bg-slate-100 mb-3">
          <div className="bg-emerald-500 h-full transition-all" style={{ width: `${sPct}%` }} title={`Puas ${sPct}%`} />
          <div className="bg-amber-400 h-full transition-all" style={{ width: `${nPct}%` }} title={`Netral ${nPct}%`} />
          <div className="bg-rose-500 h-full transition-all" style={{ width: `${uPct}%` }} title={`Tidak Puas ${uPct}%`} />
        </div>
        <div className="space-y-1.5">
          <SentimentRow icon={Smile} color="emerald" label="Puas" desc="≥ 4 ⭐" count={stats.satisfied || 0} pct={sPct} />
          <SentimentRow icon={Meh} color="amber" label="Netral" desc="3 - 4 ⭐" count={stats.neutral || 0} pct={nPct} />
          <SentimentRow icon={Frown} color="rose" label="Tidak Puas" desc="< 3 ⭐" count={stats.unsatisfied || 0} pct={uPct} />
        </div>
      </CardContent>
    </Card>
  );
};

const SentimentRow = ({ icon: Icon, color, label, desc, count, pct }) => {
  const colorMap = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
  };
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">{desc}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold">{count}</div>
        <div className="text-[10px] text-muted-foreground">{pct}%</div>
      </div>
    </div>
  );
};

const DealsTimeline = ({ timeline = [] }) => {
  if (!timeline || timeline.length === 0) {
    return <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">Loading...</div>;
  }
  const maxVal = Math.max(1, ...timeline.map(b => b.total));
  return (
    <div>
      <div className="flex items-end gap-[3px] h-32">
        {timeline.map((b, i) => {
          const totalH = b.total > 0 ? Math.max((b.total / maxVal) * 100, 5) : 0;
          const fuPct = b.total ? (b.followup / b.total) * 100 : 0;
          const lostPct = b.total ? (b.lost / b.total) * 100 : 0;
          const dealPct = b.total ? (b.deal / b.total) * 100 : 0;
          return (
            <div
              key={i}
              className="flex-1 h-full flex flex-col justify-end group relative"
              title={`${b.label} • Deal ${b.deal} • Lost ${b.lost} • FU ${b.followup}`}
            >
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                {b.label}<br />
                ✓ {b.deal} • ✗ {b.lost} • 📞 {b.followup}
              </div>
              {b.total === 0 ? (
                <div className="h-[2px] bg-slate-200 rounded-sm" />
              ) : (
                <div
                  className="bg-slate-50 rounded-t-sm overflow-hidden"
                  style={{ height: `${totalH}%` }}
                >
                  <div className="bg-blue-500" style={{ height: `${fuPct}%` }} />
                  <div className="bg-rose-500" style={{ height: `${lostPct}%` }} />
                  <div className="bg-emerald-500" style={{ height: `${dealPct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-1">
        <span>{timeline[0]?.label || '—'}</span>
        <span>now</span>
      </div>
    </div>
  );
};

export default App;

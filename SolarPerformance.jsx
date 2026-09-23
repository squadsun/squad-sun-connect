import React, { useState, useEffect } from 'react';
import { Card } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Sun, Battery, Gauge, Zap, Activity, Unlink, TrendingUp, ArrowDownCircle, ArrowUpCircle, Calendar, Wallet, MinusCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SolarHouseVisualization from '@/components/customer/solar/SolarHouseVisualization';
import { solarFlow, reading } from '@/components/customer/solar/solarFlow';

function fmtDayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'short' });
}

function fmtMonthLabel(monthStr) {
  const d = new Date(monthStr + '-01T00:00:00');
  return d.toLocaleDateString('en', { month: 'short' });
}

export default function SolarPerformance({ data, onDisconnect, lastUpdated, refreshing }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const stale = !!lastUpdated && now - lastUpdated > 120000;
  const flow = solarFlow(data, stale);
  const fmt = (v, u) => `${Number(v).toFixed(2)} ${u || ''}`;

  const dailyChart = (data.daily_history || []).map(d => ({
    name: fmtDayLabel(d.date),
    value: d.value,
    date: d.date,
  }));

  const monthlyChart = (data.monthly_history || []).map(m => ({
    name: fmtMonthLabel(m.month),
    value: m.value,
  }));

  return (
    <>
      <SolarHouseVisualization data={data} lastUpdated={lastUpdated} refreshing={refreshing} />

      <div className="flex justify-end mb-3">
        <Button onClick={onDisconnect} variant="outline" className="rounded-full text-xs h-8 text-rose-600 hover:text-rose-700">
          <Unlink className="w-3.5 h-3.5 mr-1.5" /> Disconnect
        </Button>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-[11px] text-muted-foreground">Load Power</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(data.load_power, data.load_power_unit)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            {flow.gridIn ? <ArrowDownCircle className="w-4 h-4 text-rose-500" /> : flow.gridOut ? <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> : <MinusCircle className="w-4 h-4 text-muted-foreground" />}
            <span className="text-[11px] text-muted-foreground">{flow.gridIn ? 'Grid Import' : flow.gridOut ? 'Grid Export' : 'Grid Idle'}</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{flow.gridIn ? reading(flow.grid) : flow.gridOut ? reading(flow.gridExport) : '0.00 kW'}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Gauge className="w-4 h-4 text-solar" />
            <span className="text-[11px] text-muted-foreground">Installed Capacity</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{fmt(data.installed_power, data.installed_power_unit)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-4 h-4 text-solar" />
            <span className="text-[11px] text-muted-foreground">Efficiency</span>
          </div>
          <p className="text-xl font-bold tabular-nums">{data.power_ratio}%</p>
        </Card>
      </div>

      {/* Daily Output Trends */}
      <h3 className="font-display font-semibold mb-2 px-1">Daily Output Trends</h3>
      <Card className="p-4 mb-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={dailyChart}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(35 100% 55%)" stopOpacity={0.8} />
                <stop offset="100%" stopColor="hsl(35 100% 55%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
              formatter={(value) => [`${Number(value).toFixed(1)} kWh`, 'Generation']}
            />
            <Area type="monotone" dataKey="value" stroke="hsl(35 100% 55%)" strokeWidth={2} fill="url(#solarGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Energy Production Summary */}
      <h3 className="font-display font-semibold mb-2 px-1">Energy Production</h3>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4 bg-gradient-to-br from-solar/10 to-amber-50 dark:from-solar/10 dark:to-amber-950/20">
          <Calendar className="w-4 h-4 text-solar mb-1.5" />
          <p className="text-xl font-bold tabular-nums">{Number(data.daily_generation).toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground">Today (kWh)</p>
        </Card>
        <Card className="p-4">
          <Calendar className="w-4 h-4 text-blue-500 mb-1.5" />
          <p className="text-xl font-bold tabular-nums">{Number(data.monthly_generation).toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground">This Month (kWh)</p>
        </Card>
        <Card className="p-4">
          <Calendar className="w-4 h-4 text-emerald-500 mb-1.5" />
          <p className="text-xl font-bold tabular-nums">{Number(data.yearly_generation).toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground">This Year (kWh)</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-solar/10 to-amber-50 dark:from-solar/10 dark:to-amber-950/20">
          <Wallet className="w-4 h-4 text-solar mb-1.5" />
          <p className="text-xl font-bold tabular-nums">{Number(data.total_generation).toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground">Total (kWh)</p>
        </Card>
      </div>

      {/* Monthly Output */}
      {monthlyChart.length > 0 && (
        <>
          <h3 className="font-display font-semibold mb-2 px-1">Monthly Output</h3>
          <Card className="p-4 mb-4">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={monthlyChart}>
                <defs>
                  <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160 60% 42%)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(160 60% 42%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  formatter={(value) => [`${Number(value).toFixed(1)} kWh`, 'Generation']}
                />
                <Area type="monotone" dataKey="value" stroke="hsl(160 60% 42%)" strokeWidth={2} fill="url(#monthlyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Battery System */}
      {flow.hasBattery && (
        <>
          <h3 className="font-display font-semibold mb-2 px-1">Battery System</h3>
          <Card className="p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Battery className="w-5 h-5 text-solar" />
              <span className="text-sm font-semibold">Charge Level</span>
              <span className="ml-auto text-2xl font-extrabold text-solar tabular-nums">{flow.soc != null ? `${Math.round(flow.soc)}%` : 'N/A'}</span>
            </div>
            {flow.soc != null && (
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-solar transition-all duration-700"
                  style={{ width: `${Math.min(Math.max(flow.soc, 0), 100)}%` }}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Charge Power</p>
                <p className="text-sm font-bold tabular-nums">{reading(flow.charge)}</p>
                <p className="text-[10px] text-muted-foreground">{flow.charging ? 'Charging' : 'Idle'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Discharge Power</p>
                <p className="text-sm font-bold tabular-nums">{reading(flow.discharge)}</p>
                <p className="text-[10px] text-muted-foreground">{flow.discharging ? 'Discharging' : 'Idle'}</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Plus, ChevronRight, TrendingDown, Leaf, Loader2, PiggyBank, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCustomerData } from '@/lib/customerDataContext';
import { Card } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { formatPeso } from '@/lib/format';
import { getElectricityRate, estimatedSavings, isDefaultRate } from '@/lib/savingsUtils';
import AddBillModal from '@/components/customer/AddBillModal';

export default function SolarSavingsTrackerCard() {
  const { customer, projects, project } = useCustomerData();
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(true);
  const [solarData, setSolarData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadBills = useCallback(async () => {
    if (!customer?.id) { setLoadingBills(false); return; }
    try {
      const list = await base44.entities.MeralcoBill.filter({ customer_id: customer.id }, '-created_date', 50);
      setBills(list || []);
    } catch (e) {
      console.error('Failed to load bills', e);
    } finally {
      setLoadingBills(false);
    }
  }, [customer?.id]);

  const activeProject = (projects || []).find(p => p.solar_email && p.solar_password) || project;
  const solarEmail = activeProject?.solar_email || customer?.solar_email || customer?.sunways_email;
  const solarPassword = activeProject?.solar_password || customer?.solar_password || customer?.sunways_password;
  const hasCredentials = !!(solarEmail && solarPassword);

  useEffect(() => { loadBills(); }, [loadBills]);

  useEffect(() => {
    if (!hasCredentials) return;
    let active = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('solarMonitoring', {
          portal: activeProject?.portal || customer?.solar_portal || 'sunways',
          email: solarEmail,
          password: solarPassword,
          stationId: activeProject?.solar_station_id || customer?.solar_station_id,
          project_id: activeProject?.id,
        });
        if (active && res.data && !res.data.error) setSolarData(res.data);
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [hasCredentials, solarEmail, solarPassword, activeProject?.id]);

  const latest = bills[0];
  const previous = bills[1];
  const rate = getElectricityRate(bills);
  const usingDefault = isDefaultRate(bills);

  const monthlySavings = solarData?.monthly_generation ? estimatedSavings(solarData.monthly_generation, rate) : null;
  const diff = latest && previous ? latest.amount - previous.amount : null;

  return (
    <>
      <Card className="overflow-hidden mb-4">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-solar/20 to-solar/5 grid place-items-center">
              <PiggyBank className="w-5 h-5 text-solar" />
            </span>
            <div className="flex-1">
              <h3 className="font-display font-bold text-base leading-tight">Solar Savings Tracker</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Track your electricity bill, solar generation, and savings</p>
            </div>
          </div>
        </div>

        {loadingBills ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="px-4 pb-4">
            {/* Bill comparison — two-column grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted/50 p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground">Latest Bill</p>
                <p className="font-display font-extrabold text-xl mt-1 tabular-nums">
                  {latest ? formatPeso(latest.amount) : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {latest?.bill_period || (latest?.bill_date
                    ? new Date(latest.bill_date).toLocaleDateString('en', { month: 'short', year: 'numeric' })
                    : 'No bills yet')}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground">Previous Bill</p>
                <p className="font-display font-extrabold text-xl mt-1 tabular-nums">
                  {previous ? formatPeso(previous.amount) : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {previous?.bill_period || (previous?.bill_date
                    ? new Date(previous.bill_date).toLocaleDateString('en', { month: 'short', year: 'numeric' })
                    : '')}
                </p>
              </div>
            </div>

            {/* Bill diff indicator */}
            {diff != null && (
              <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                diff < 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
              }`}>
                {diff < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                {diff < 0
                  ? `Bill down ${formatPeso(Math.abs(diff))} from last bill`
                  : `Bill up ${formatPeso(diff)} from last bill`}
              </div>
            )}

            {/* Estimated Solar Savings — highlighted section */}
            <div className="mt-3 rounded-2xl p-4 bg-gradient-to-br from-amber-50 via-amber-50/50 to-solar/10 dark:from-amber-950/30 dark:via-amber-900/10 dark:to-solar/5 border border-solar/15">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-solar/15 grid place-items-center">
                    <Leaf className="w-4 h-4 text-solar" />
                  </span>
                  <p className="text-xs font-semibold text-solar">Estimated Solar Savings</p>
                </div>
                {monthlySavings != null && (
                  <span className="text-[10px] font-medium text-solar/70 px-2 py-0.5 rounded-full bg-solar/10">This Month</span>
                )}
              </div>
              <p className="font-display font-extrabold text-3xl text-solar tabular-nums leading-none mt-1">
                {monthlySavings != null ? formatPeso(monthlySavings) : '—'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-2">
                {monthlySavings != null
                  ? `${solarData?.monthly_generation?.toFixed(1) || 0} kWh × ₱${rate.toFixed(2)}/kWh${usingDefault ? ' · Default rate' : ''}`
                  : hasCredentials
                    ? 'Loading solar data…'
                    : 'Connect your solar system to track savings'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-solar/40 text-solar text-xs font-semibold active:scale-[0.98] transition hover:bg-solar/5"
              >
                <Plus className="w-4 h-4" /> Add New Bill
              </button>
              <Link
                to="/savings-details"
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-ink text-ink-foreground text-xs font-semibold active:scale-[0.98] transition"
              >
                View Details <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </Card>

      <AddBillModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadBills}
        customer={customer}
      />
    </>
  );
}
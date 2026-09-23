import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { SOLAR_PACKAGES, SETUP_TYPES, MODES_OF_PAYMENT } from '@/lib/solarPackages';
import Section from '@/components/admin/enroll/Section';
import { Sun, CreditCard, Save, Wifi, Plus, CheckCircle2, MapPin } from 'lucide-react';

const PROJECT_COMPLETE = 'project_completed';

export default function ProjectSetupsSection({ customer, onUpdated }) {
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newSetup, setNewSetup] = useState({ setup_name: '', location: '', portal: 'deye', solar_email: '', solar_password: '', solar_station_id: '' });

  useEffect(() => { loadProjects(); }, [customer.id]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Project.filter({ customer_id: customer.id });
      const sorted = (list || []).slice().sort((a, b) => (a.created_date || '').localeCompare(b.created_date || ''));
      setProjects(sorted);
      if (!selectedId && sorted.length) setSelectedId(sorted[0].id);
    } catch { setProjects([]); } finally { setLoading(false); }
  };

  const selected = projects.find(p => p.id === selectedId) || projects[0];

  const updateField = (field, value) => {
    setProjects(prev => prev.map(p => p.id === selected.id ? { ...p, [field]: value } : p));
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.Project.update(selected.id, {
        system_name: selected.system_name,
        address: selected.address,
        solar_package: selected.solar_package,
        setup_type: selected.setup_type || undefined,
        assigned_team: selected.assigned_team || undefined,
        contact_person: selected.contact_person || undefined,
        panel_qty: Number(selected.panel_qty) || 0,
        battery_qty: Number(selected.battery_qty) || 0,
        inverter_qty: Number(selected.inverter_qty) || 0,
        mode_of_payment: selected.mode_of_payment || undefined,
        reservation_fee_amount: selected.reservation_fee_amount ? Number(selected.reservation_fee_amount) : 0,
        rf_paid_date: selected.rf_paid_date || undefined,
        has_downpayment: !!selected.has_downpayment,
        payment_type: selected.payment_type || 'cash',
        portal: selected.portal || undefined,
        solar_email: selected.solar_email || '',
        solar_password: selected.solar_password || '',
        solar_station_id: selected.solar_station_id || '',
      });
      toast({ title: 'Setup updated' });
      onUpdated?.();
    } catch { toast({ title: 'Failed to update setup' }); } finally { setSaving(false); }
  };

  const markComplete = async () => {
    setSaving(true);
    try {
      await base44.entities.Project.update(selected.id, { status: PROJECT_COMPLETE, progress_percent: 100 });
      toast({ title: 'Project marked complete', description: 'Solar monitoring portal is now available.' });
      loadProjects();
      onUpdated?.();
    } catch { toast({ title: 'Failed to mark complete' }); } finally { setSaving(false); }
  };

  const addSetup = async () => {
    setSaving(true);
    try {
      const count = projects.length + 1;
      await base44.entities.Project.create({
        project_id: `PRJ-${customer.customer_code}-${count}`,
        customer_id: customer.id,
        user_id: '',
        user_email: customer.email,
        system_name: newSetup.setup_name || `${customer.full_name} Solar System ${count}`,
        address: newSetup.location,
        portal: newSetup.portal,
        solar_email: newSetup.solar_email,
        solar_password: newSetup.solar_password,
        solar_station_id: newSetup.solar_station_id,
        status: 'reservation_confirmed',
        progress_percent: 0,
      });
      toast({ title: 'Additional setup added' });
      setAdding(false);
      setNewSetup({ setup_name: '', location: '', portal: 'deye', solar_email: '', solar_password: '', solar_station_id: '' });
      loadProjects();
      onUpdated?.();
    } catch { toast({ title: 'Failed to add setup' }); } finally { setSaving(false); }
  };

  if (loading) return <div className="py-6 text-center text-sm text-muted-foreground">Loading setups…</div>;
  if (projects.length === 0 && !adding) return (
    <Section icon={Sun} title="Solar Setups" description="No setups yet">
      <Button type="button" onClick={() => setAdding(true)} className="rounded-xl bg-solar text-ink hover:bg-solar/90">
        <Plus className="w-4 h-4" /> Add First Setup
      </Button>
    </Section>
  );

  const isComplete = selected?.status === PROJECT_COMPLETE;
  const selectedPkg = SOLAR_PACKAGES.find(p => p.name === selected?.solar_package);

  return (
    <div className="space-y-5">
      {/* Setup selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-semibold text-sm">Solar Setups ({projects.length})</h3>
          <Button type="button" size="sm" variant="outline" onClick={() => setAdding(!adding)} className="rounded-lg h-8 text-xs">
            <Plus className="w-3 h-3" /> Add Setup
          </Button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {projects.map((p, i) => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className={`flex-shrink-0 w-40 text-left p-2.5 rounded-xl border transition ${p.id === selected?.id ? 'border-solar bg-solar/10' : 'border-border bg-card'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold text-muted-foreground">SETUP {i + 1}</span>
                {p.status === PROJECT_COMPLETE && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              </div>
              <p className="font-semibold text-xs leading-tight line-clamp-2">{p.system_name || `Setup ${i + 1}`}</p>
              {p.address && <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 line-clamp-1"><MapPin className="w-2.5 h-2.5" /> {p.address}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Add new setup form */}
      {adding && (
        <div className="p-4 rounded-xl border border-solar/30 bg-solar/5 space-y-3">
          <h4 className="font-semibold text-sm">New Additional Setup</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs font-semibold">Setup Name</Label><Input value={newSetup.setup_name} onChange={e => setNewSetup(s => ({ ...s, setup_name: e.target.value }))} placeholder="e.g., Maria Beach House Solar" className="mt-1 h-10 rounded-lg" /></div>
            <div><Label className="text-xs font-semibold">Location / Address</Label><Input value={newSetup.location} onChange={e => setNewSetup(s => ({ ...s, location: e.target.value }))} placeholder="Installation address" className="mt-1 h-10 rounded-lg" /></div>
            <div>
              <Label className="text-xs font-semibold">Brand / Portal</Label>
              <Select value={newSetup.portal} onValueChange={v => setNewSetup(s => ({ ...s, portal: v }))}>
                <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deye">Deye</SelectItem>
                  <SelectItem value="solis">Solis</SelectItem>
                  <SelectItem value="sunways">Sunways</SelectItem>
                  <SelectItem value="dyness">Dyness</SelectItem>
                  <SelectItem value="skyworth">Skyworth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs font-semibold">Portal Email</Label><Input type="email" value={newSetup.solar_email} onChange={e => setNewSetup(s => ({ ...s, solar_email: e.target.value }))} className="mt-1 h-10 rounded-lg" /></div>
            <div><Label className="text-xs font-semibold">Portal Password</Label><Input type="password" value={newSetup.solar_password} onChange={e => setNewSetup(s => ({ ...s, solar_password: e.target.value }))} className="mt-1 h-10 rounded-lg" /></div>
            <div><Label className="text-xs font-semibold">Station ID (optional)</Label><Input value={newSetup.solar_station_id} onChange={e => setNewSetup(s => ({ ...s, solar_station_id: e.target.value }))} className="mt-1 h-10 rounded-lg" /></div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={addSetup} disabled={saving} className="rounded-lg bg-solar text-ink hover:bg-solar/90 text-sm">{saving ? 'Adding…' : 'Add Setup'}</Button>
            <Button type="button" variant="outline" onClick={() => setAdding(false)} className="rounded-lg text-sm">Cancel</Button>
          </div>
        </div>
      )}

      {selected && (
        <>
          {/* Project Setup */}
          <Section icon={Sun} title="Project Setup" description="Setup name, location, and installation details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Setup Name (visible to customer)</Label>
                <Input value={selected.system_name || ''} onChange={e => updateField('system_name', e.target.value)} placeholder="e.g., Maria Santos Solar System" className="mt-1 h-10 rounded-lg" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Location / Address</Label>
                <Input value={selected.address || ''} onChange={e => updateField('address', e.target.value)} className="mt-1 h-10 rounded-lg" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Solar Package</Label>
              <Select value={selectedPkg?.id || ''} onValueChange={id => { const p = SOLAR_PACKAGES.find(x => x.id === id); updateField('solar_package', p?.name || ''); }}>
                <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue placeholder="Select a package" /></SelectTrigger>
                <SelectContent>{SOLAR_PACKAGES.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs font-semibold">Setup Type</Label>
                <Select value={selected.setup_type} onValueChange={v => updateField('setup_type', v)}>
                  <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{SETUP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs font-semibold">Assigned Team</Label><Input value={selected.assigned_team || ''} onChange={e => updateField('assigned_team', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
              <div><Label className="text-xs font-semibold">Contact Person</Label><Input value={selected.contact_person || ''} onChange={e => updateField('contact_person', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs font-semibold">Panel (qty)</Label><Input type="number" min="0" value={selected.panel_qty || 0} onChange={e => updateField('panel_qty', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
              <div><Label className="text-xs font-semibold">Battery (qty)</Label><Input type="number" min="0" value={selected.battery_qty || 0} onChange={e => updateField('battery_qty', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
              <div><Label className="text-xs font-semibold">Inverter (qty)</Label><Input type="number" min="0" value={selected.inverter_qty || 0} onChange={e => updateField('inverter_qty', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
            </div>
          </Section>

          {/* Payment Tracking */}
          <Section icon={CreditCard} title="Payment Tracking" description="Reservation fee, downpayment, and payment mode">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs font-semibold">Mode of Payment</Label>
                <Select value={selected.mode_of_payment} onValueChange={v => updateField('mode_of_payment', v)}>
                  <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{MODES_OF_PAYMENT.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs font-semibold">Reservation Fee (₱)</Label><Input type="number" min="0" value={selected.reservation_fee_amount || ''} onChange={e => updateField('reservation_fee_amount', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
              <div><Label className="text-xs font-semibold">RF Paid Date</Label><Input type="date" value={selected.rf_paid_date || ''} onChange={e => updateField('rf_paid_date', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs font-semibold">Payment Type</Label>
                <Select value={selected.payment_type || 'cash'} onValueChange={v => updateField('payment_type', v)}>
                  <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="installment">Installment</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
                <div><Label className="text-xs font-semibold">Downpayment</Label><p className="text-[11px] text-muted-foreground">{selected.has_downpayment ? 'Yes' : 'No'}</p></div>
                <Switch checked={!!selected.has_downpayment} onCheckedChange={v => updateField('has_downpayment', v)} />
              </div>
            </div>
          </Section>

          {/* Project Status / Mark as Complete */}
          <Section icon={CheckCircle2} title="Project Status" description="Mark this setup as complete to enable solar monitoring">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30">
              <div>
                <Label className="text-xs font-semibold">Installation Status</Label>
                <p className="text-sm font-semibold mt-0.5">{isComplete ? '✅ Completed' : 'In Progress'}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{isComplete ? 'Solar monitoring is enabled for this setup' : 'Mark complete after successful installation'}</p>
              </div>
              {!isComplete && (
                <Button type="button" onClick={markComplete} disabled={saving} className="rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Mark Complete
                </Button>
              )}
            </div>
          </Section>

          {/* Solar Monitoring Portal — only visible after completion */}
          {isComplete && (
            <Section icon={Wifi} title="Solar Monitoring Portal" description="Set the brand and credentials for live monitoring">
              <div>
                <Label className="text-xs font-semibold">Portal Brand</Label>
                <Select value={selected.portal || 'sunways'} onValueChange={v => updateField('portal', v)}>
                  <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deye">Deye</SelectItem>
                    <SelectItem value="solis">Solis</SelectItem>
                    <SelectItem value="sunways">Sunways</SelectItem>
                    <SelectItem value="dyness">Dyness</SelectItem>
                    <SelectItem value="skyworth">Skyworth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs font-semibold">Portal Email</Label><Input type="email" value={selected.solar_email || ''} onChange={e => updateField('solar_email', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
                <div><Label className="text-xs font-semibold">Portal Password</Label><Input type="password" value={selected.solar_password || ''} onChange={e => updateField('solar_password', e.target.value)} className="mt-1 h-10 rounded-lg" /></div>
              </div>
              <div><Label className="text-xs font-semibold">Station ID (optional)</Label><Input value={selected.solar_station_id || ''} onChange={e => updateField('solar_station_id', e.target.value)} className="mt-1 h-10 rounded-lg" placeholder="Auto-detected if blank" /></div>
            </Section>
          )}

          <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl bg-solar text-ink hover:bg-solar/90 text-sm font-bold">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Setup Changes'}
          </Button>
        </>
      )}
    </div>
  );
}
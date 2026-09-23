import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Modal } from '@/components/customer/ui';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { useToast } from '@/components/ui/use-toast';
import { projectStatusLabel } from '@/lib/format';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { User, ShieldCheck, Check, Wrench, Headset } from 'lucide-react';

const STAGES = Object.keys(projectStatusLabel);

const EMPTY_CUSTOMER = {
  full_name: '', email: '', mobile: '', property_address: '',
  solar_package: '', system_capacity: '',
  system_name: '', status: 'reservation_confirmed', installation_date: '',
  assigned_team: '', project_manager: '',
};

const ACCESS = {
  admin: [
    'Manage customers & enroll new accounts',
    'Create & update solar projects',
    'Update milestones & project status',
    'View & update the appointment schedule',
    'Manage vouchers & warranty claims',
    'Respond to support tickets',
    'Invite new admin / staff users',
  ],
  user: [
    'Access the customer portal only',
    'View own project & milestones',
    'Book appointments & use vouchers',
    'Submit support tickets',
  ],
  engineer: [
    'Access the Engineer Portal',
    'View assigned projects & technical tickets',
    'Manage maintenance & cleaning requests',
    'Submit service reports',
    'View the service calendar',
  ],
  csr: [
    'Access the CSR Portal (/CSR)',
    'Update client project trackers & milestones',
    'Communicate directly with clients via Inbox',
    'Manage & schedule appointments',
    'View the shared operations calendar',
  ],
};

const roleLabel = { admin: 'Admin', engineer: 'Engineer', csr: 'CSR', user: 'User' };

export default function EnrollCustomerModal({ open, onClose, onCreated }) {
  const { toast } = useToast();
  const [mode, setMode] = useState('customer');
  const [custForm, setCustForm] = useState(EMPTY_CUSTOMER);
  const [adminForm, setAdminForm] = useState({ full_name: '', email: '', role: 'admin' });
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (open) {
      base44.entities.Customer.list('-created_date', 300)
        .then((list) => setCount((list || []).length))
        .catch(() => {});
    }
  }, [open]);

  const setC = (k) => (e) => setCustForm((f) => ({ ...f, [k]: e.target.value }));
  const setA = (k) => (e) => setAdminForm((f) => ({ ...f, [k]: e.target.value }));
  const setCVal = (k) => (val) => setCustForm((f) => ({ ...f, [k]: val }));
  const setAVal = (k) => (val) => setAdminForm((f) => ({ ...f, [k]: val }));

  const submitCustomer = async () => {
    const n = count + 1;
    const code = `CUST-${String(n).padStart(4, '0')}`;
    const projCode = `PRJ-${String(n).padStart(4, '0')}`;
    const customer = await base44.entities.Customer.create({
      customer_code: code,
      full_name: custForm.full_name,
      email: custForm.email,
      mobile: custForm.mobile,
      property_address: custForm.property_address,
      solar_package: custForm.solar_package,
      system_capacity: custForm.system_capacity,
      account_status: 'active',
      is_demo: false,
    });
    await base44.entities.Project.create({
      project_id: projCode,
      customer_id: customer.id,
      user_id: '',
      system_name: custForm.system_name || `${custForm.full_name} Solar System`,
      solar_package: custForm.solar_package,
      system_capacity_kw: Number(custForm.system_capacity) || 0,
      status: custForm.status,
      progress_percent: 0,
      address: custForm.property_address,
      installation_date: custForm.installation_date || undefined,
      assigned_team: custForm.assigned_team,
      project_manager: custForm.project_manager,
    });
    try { await base44.users.inviteUser(custForm.email, 'user'); } catch { /* invite may fail if user exists */ }

    // Free benefits: 6 monthly maintenance visits + 2 solar panel cleaning vouchers
    const now = new Date();
    const ymd = (d) => d.toISOString().slice(0, 10);
    const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };
    const expiry = ymd(addMonths(now, 6));

    const maintRecords = Array.from({ length: 6 }, (_, i) => ({
      request_number: `MAINT-${code}-${i + 1}`,
      customer_id: customer.id,
      customer_name: custForm.full_name,
      address: custForm.property_address,
      system_size: custForm.system_capacity,
      request_date: ymd(now),
      preferred_date: ymd(addMonths(now, i + 1)),
      status: 'scheduled',
      completion_notes: 'Complimentary monthly maintenance visit (6-month free plan).',
    }));
    await base44.entities.MaintenanceRequest.bulkCreate(maintRecords);

    const voucherRecords = [1, 2].map((i) => ({
      voucher_id: `VCH-${code}-CLN${i}`,
      customer_id: customer.id,
      service: 'Solar Panel Cleaning',
      value: 'Free',
      valid_until: expiry,
      status: 'available',
      description: 'Complimentary solar panel cleaning voucher (6-month free plan).',
      terms: 'Valid for one solar panel cleaning service. Subject to scheduling availability.',
    }));
    await base44.entities.Voucher.bulkCreate(voucherRecords);
  };

  const submitAdmin = async () => {
    await base44.users.inviteUser(adminForm.email, adminForm.role);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === 'customer') {
        await submitCustomer();
        toast({ title: 'Customer enrolled', description: 'Customer + project created, 6 monthly maintenance visits + 2 cleaning vouchers added, invite sent.' });
        setCustForm(EMPTY_CUSTOMER);
      } else {
        await submitAdmin();
        toast({ title: `${roleLabel[adminForm.role] || 'Staff'} invited`, description: `Invitation sent to ${adminForm.email}.` });
        setAdminForm({ full_name: '', email: '', role: 'admin' });
      }
      onCreated?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Enroll Account">
      <div className="mb-4 grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted">
        <button type="button" onClick={() => setMode('customer')} className={`py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${mode === 'customer' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>
          <User className="w-4 h-4" /> Customer
        </button>
        <button type="button" onClick={() => setMode('admin')} className={`py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 ${mode === 'admin' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}>
          <ShieldCheck className="w-4 h-4" /> Staff
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'customer' ? (
          <>
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Customer Details</h3>
              <div className="space-y-3">
                <div><Label className="text-xs font-semibold">Full name *</Label><Input required value={custForm.full_name} onChange={setC('full_name')} className="mt-1 h-11 rounded-xl" /></div>
                <div><Label className="text-xs font-semibold">Email *</Label><Input required type="email" value={custForm.email} onChange={setC('email')} className="mt-1 h-11 rounded-xl" placeholder="Used to invite the customer" /></div>
                <div><Label className="text-xs font-semibold">Mobile</Label><Input value={custForm.mobile} onChange={setC('mobile')} className="mt-1 h-11 rounded-xl" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold">Solar package</Label><Input value={custForm.solar_package} onChange={setC('solar_package')} className="mt-1 h-11 rounded-xl" /></div>
                  <div><Label className="text-xs font-semibold">System capacity (kW)</Label><Input type="number" value={custForm.system_capacity} onChange={setC('system_capacity')} className="mt-1 h-11 rounded-xl" /></div>
                </div>
                <div><Label className="text-xs font-semibold">Property address</Label><textarea value={custForm.property_address} onChange={setC('property_address')} rows={2} className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" /></div>
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Project Setup</h3>
              <div className="space-y-3">
                <div><Label className="text-xs font-semibold">System name</Label><Input value={custForm.system_name} onChange={setC('system_name')} className="mt-1 h-11 rounded-xl" placeholder="Defaults to customer name" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={custForm.status} onValueChange={setCVal('status')}>
                      <SelectTrigger className="mt-1 w-full h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => <SelectItem key={s} value={s}>{projectStatusLabel[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs font-semibold">Install date</Label><Input type="date" value={custForm.installation_date} onChange={setC('installation_date')} className="mt-1 h-11 rounded-xl" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs font-semibold">Assigned team</Label><Input value={custForm.assigned_team} onChange={setC('assigned_team')} className="mt-1 h-11 rounded-xl" /></div>
                  <div><Label className="text-xs font-semibold">Project manager</Label><Input value={custForm.project_manager} onChange={setC('project_manager')} className="mt-1 h-11 rounded-xl" /></div>
                </div>
              </div>
            </section>

          </>
        ) : (
          <>
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{roleLabel[adminForm.role] || 'Staff'} Details</h3>
              <div className="space-y-3">
                <div><Label className="text-xs font-semibold">Full name *</Label><Input required value={adminForm.full_name} onChange={setA('full_name')} className="mt-1 h-11 rounded-xl" /></div>
                <div><Label className="text-xs font-semibold">Email *</Label><Input required type="email" value={adminForm.email} onChange={setA('email')} className="mt-1 h-11 rounded-xl" placeholder="Invitation will be sent here" /></div>
                <div>
                  <Label className="text-xs font-semibold">Role</Label>
                  <Select value={adminForm.role} onValueChange={setAVal('role')}>
                    <SelectTrigger className="mt-1 w-full h-11 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin — full console access</SelectItem>
                      <SelectItem value="engineer">Engineer — engineer portal access</SelectItem>
                      <SelectItem value="csr">CSR — customer service portal</SelectItem>
                      <SelectItem value="user">User — customer portal only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {adminForm.role === 'engineer' && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-solar/10 border border-solar/30">
                <Wrench className="w-4 h-4 text-solar mt-0.5 shrink-0" />
                <p className="text-sm text-foreground"><strong>Engineer Portal access.</strong> Once they set up their password and log in via the staff portal, they'll be automatically redirected to the engineer console with technical functions.</p>
              </div>
            )}
            {adminForm.role === 'csr' && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-solar/10 border border-solar/30">
                <Headset className="w-4 h-4 text-solar mt-0.5 shrink-0" />
                <p className="text-sm text-foreground"><strong>CSR Portal access.</strong> Once they set up their password and log in via the staff portal, they'll be redirected to the CSR console to manage project trackers, client communications, and scheduling.</p>
              </div>
            )}

            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Access Permissions</h3>
              <ul className="space-y-1.5">
                {ACCESS[adminForm.role].map((a) => (
                  <li key={a} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-solar mt-0.5 shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <Button type="submit" disabled={saving} className="w-full h-11 rounded-xl bg-solar text-ink hover:bg-solar/90">
          {saving ? 'Sending…' : mode === 'customer' ? 'Enroll Customer' : `Invite ${roleLabel[adminForm.role] || 'Staff'}`}
        </Button>
      </form>
    </Modal>
  );
}
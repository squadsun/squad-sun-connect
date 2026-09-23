import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input-label-fix';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { SOLAR_PACKAGES, PACKAGE_INCLUDED } from '@/lib/solarPackages';
import Section from '@/components/admin/enroll/Section';
import { User, Phone, MapPin, Sun, Save, ShieldCheck, Sparkles } from 'lucide-react';
import ProjectSetupsSection from '@/components/admin/customer/ProjectSetupsSection';

function calcAge(bday) {
  if (!bday) return '';
  const d = new Date(bday);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)) || '';
}

export default function DetailsTab({ customer, onUpdated }) {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      first_name: customer.first_name || '', middle_name: customer.middle_name || '', last_name: customer.last_name || '', suffix: customer.suffix || '',
      birthday: customer.birthday || '', gender: customer.gender || '', citizenship: customer.citizenship || '', civil_status: customer.civil_status || '',
      employment_status: customer.employment_status || 'non_working', company_name: customer.company_name || '', position: customer.position || '',
      mobile: customer.mobile || '', email: customer.email || '', alternative_contact: customer.alternative_contact || '',
      emergency_contact_name: customer.emergency_contact_name || '', emergency_contact_number: customer.emergency_contact_number || '',
      home_number: customer.home_number || '', street_name: customer.street_name || '', barangay: customer.barangay || '', subdivision: customer.subdivision || '',
      city: customer.city || '', province: customer.province || '', zipcode: customer.zipcode || '',
      solar_package: customer.solar_package || '',
      support_plan: customer.support_plan || '', support_plan_expiry: customer.support_plan_expiry || '',
      assigned_engineer: customer.assigned_engineer || '', project_manager: customer.project_manager || '', account_status: customer.account_status || 'active',
    });
  }, [customer.id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  if (!form) return <div className="py-10 text-center text-sm text-muted-foreground">Loading details…</div>;

  const age = calcAge(form.birthday);
  const selectedPkg = SOLAR_PACKAGES.find((p) => p.name === form.solar_package);
  const pkgId = selectedPkg?.id || '';

  const onPkgChange = (id) => {
    const p = SOLAR_PACKAGES.find((x) => x.id === id);
    setForm((f) => ({ ...f, solar_package: p?.name || '', system_capacity: p ? String(p.capacity_kw) : '' }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const fullName = [form.first_name, form.middle_name, form.last_name, form.suffix].filter(Boolean).join(' ');
      const fullAddress = [form.home_number, form.street_name, form.barangay, form.subdivision, form.city, form.province, form.zipcode].filter(Boolean).join(', ');

      await base44.entities.Customer.update(customer.id, {
        first_name: form.first_name, middle_name: form.middle_name, last_name: form.last_name, suffix: form.suffix,
        full_name: fullName, birthday: form.birthday || undefined, age: age ? Number(age) : undefined,
        gender: form.gender || undefined, citizenship: form.citizenship || undefined, civil_status: form.civil_status || undefined,
        employment_status: form.employment_status, company_name: form.company_name || undefined, position: form.position || undefined,
        mobile: form.mobile, email: form.email, alternative_contact: form.alternative_contact,
        emergency_contact_name: form.emergency_contact_name || undefined, emergency_contact_number: form.emergency_contact_number || undefined,
        home_number: form.home_number, street_name: form.street_name, barangay: form.barangay, subdivision: form.subdivision,
        city: form.city, province: form.province, zipcode: form.zipcode, property_address: fullAddress,
        solar_package: form.solar_package, system_capacity: selectedPkg ? String(selectedPkg.capacity_kw) : (form.system_capacity || ''),
        support_plan: form.support_plan, support_plan_expiry: form.support_plan_expiry || undefined,
        assigned_engineer: form.assigned_engineer, project_manager: form.project_manager, account_status: form.account_status,
      });

      toast({ title: 'Customer updated' });
      onUpdated?.();
    } catch {
      toast({ title: 'Failed to update customer' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Personal Information */}
      <Section icon={User} title="Personal Information" description="Customer's complete personal details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><Label className="text-xs font-semibold">First Name *</Label><Input value={form.first_name} onChange={set('first_name')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Middle Name</Label><Input value={form.middle_name} onChange={set('middle_name')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Last Name *</Label><Input value={form.last_name} onChange={set('last_name')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Suffix</Label><Input value={form.suffix} onChange={set('suffix')} placeholder="Jr, Sr, III" className="mt-1 h-10 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><Label className="text-xs font-semibold">Birthday</Label><Input type="date" value={form.birthday} onChange={set('birthday')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Age</Label><Input value={age} readOnly placeholder="Auto-calculated" className="mt-1 h-10 rounded-lg bg-muted/50" /></div>
          <div>
            <Label className="text-xs font-semibold">Gender</Label>
            <Select value={form.gender} onValueChange={setVal('gender')}>
              <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><Label className="text-xs font-semibold">Citizenship</Label><Input value={form.citizenship} onChange={set('citizenship')} placeholder="Filipino" className="mt-1 h-10 rounded-lg" /></div>
          <div>
            <Label className="text-xs font-semibold">Civil Status</Label>
            <Select value={form.civil_status} onValueChange={setVal('civil_status')}>
              <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold">Employment Status</Label>
            <Select value={form.employment_status} onValueChange={setVal('employment_status')}>
              <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="working">Working</SelectItem>
                <SelectItem value="non_working">Non-Working</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.employment_status === 'working' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-solar/5 border border-solar/20">
            <div><Label className="text-xs font-semibold">Company Name</Label><Input value={form.company_name} onChange={set('company_name')} className="mt-1 h-10 rounded-lg" /></div>
            <div><Label className="text-xs font-semibold">Position</Label><Input value={form.position} onChange={set('position')} className="mt-1 h-10 rounded-lg" /></div>
          </div>
        )}
      </Section>

      {/* Contact Details */}
      <Section icon={Phone} title="Contact Details" description="Primary and emergency contact information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs font-semibold">Mobile Number *</Label><Input value={form.mobile} onChange={set('mobile')} placeholder="09XX XXX XXXX" className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Email *</Label><Input type="email" value={form.email} onChange={set('email')} className="mt-1 h-10 rounded-lg" /></div>
        </div>
        <div><Label className="text-xs font-semibold">Alternative Contact</Label><Input value={form.alternative_contact} onChange={set('alternative_contact')} className="mt-1 h-10 rounded-lg" /></div>
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">In Case of Emergency</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><Label className="text-xs font-semibold">Emergency Contact Name</Label><Input value={form.emergency_contact_name} onChange={set('emergency_contact_name')} className="mt-1 h-10 rounded-lg" /></div>
            <div><Label className="text-xs font-semibold">Emergency Contact Number</Label><Input value={form.emergency_contact_number} onChange={set('emergency_contact_number')} placeholder="09XX XXX XXXX" className="mt-1 h-10 rounded-lg" /></div>
          </div>
        </div>
      </Section>

      {/* Complete Address */}
      <Section icon={MapPin} title="Complete Address" description="Customer's property installation address">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><Label className="text-xs font-semibold">Home / House Number</Label><Input value={form.home_number} onChange={set('home_number')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Street Name</Label><Input value={form.street_name} onChange={set('street_name')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Barangay</Label><Input value={form.barangay} onChange={set('barangay')} className="mt-1 h-10 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><Label className="text-xs font-semibold">Subdivision / Village</Label><Input value={form.subdivision} onChange={set('subdivision')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">City</Label><Input value={form.city} onChange={set('city')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Province</Label><Input value={form.province} onChange={set('province')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Zipcode</Label><Input value={form.zipcode} onChange={set('zipcode')} className="mt-1 h-10 rounded-lg" /></div>
        </div>
      </Section>

      {/* Solar Setups — multi-project management */}
      <ProjectSetupsSection customer={customer} onUpdated={onUpdated} />

      {/* Account & Support */}
      <Section icon={ShieldCheck} title="Account & Support" description="Support plan, assignments, and account status">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs font-semibold">Support Plan</Label><Input value={form.support_plan} onChange={set('support_plan')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Plan Expiry</Label><Input type="date" value={form.support_plan_expiry} onChange={set('support_plan_expiry')} className="mt-1 h-10 rounded-lg" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><Label className="text-xs font-semibold">Assigned Engineer</Label><Input value={form.assigned_engineer} onChange={set('assigned_engineer')} className="mt-1 h-10 rounded-lg" /></div>
          <div><Label className="text-xs font-semibold">Project Manager</Label><Input value={form.project_manager} onChange={set('project_manager')} className="mt-1 h-10 rounded-lg" /></div>
        </div>
        <div>
          <Label className="text-xs font-semibold">Account Status</Label>
          <Select value={form.account_status || 'active'} onValueChange={setVal('account_status')}>
            <SelectTrigger className="mt-1 w-full h-10 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Button onClick={save} disabled={saving} className="w-full h-12 rounded-xl bg-solar text-ink hover:bg-solar/90 text-sm font-bold">
        <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Customer Details'}
      </Button>
    </div>
  );
}
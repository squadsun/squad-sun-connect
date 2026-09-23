import { useState } from 'react';
import DetailsTab from '@/components/admin/customer/DetailsTab';
import DocumentsTab from '@/components/admin/customer/DocumentsTab';
import WarrantiesTab from '@/components/admin/customer/WarrantiesTab';
import BillingTab from '@/components/admin/customer/BillingTab';
import UploadsTab from '@/components/admin/customer/UploadsTab';

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'documents', label: 'Documents' },
  { key: 'warranties', label: 'Warranties' },
  { key: 'billing', label: 'Billing' },
  { key: 'uploads', label: 'Uploads' },
];

export default function CustomerDetailPanel({ customer, onUpdated }) {
  const [tab, setTab] = useState('details');
  if (!customer) return null;
  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 p-1 rounded-xl bg-muted mx-3 mt-3 shrink-0 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${tab === t.key ? 'bg-solar text-ink' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'details' && <DetailsTab customer={customer} onUpdated={onUpdated} />}
        {tab === 'documents' && <DocumentsTab customer={customer} />}
        {tab === 'warranties' && <WarrantiesTab customer={customer} />}
        {tab === 'billing' && <BillingTab customer={customer} />}
        {tab === 'uploads' && <UploadsTab customer={customer} />}
      </div>
    </div>
  );
}
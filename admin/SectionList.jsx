import { useEffect, useState } from 'react';
import { Search, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, Spinner, PageTitle } from '@/components/customer/ui';
import { DataTable, StatusBadge, PriorityBadge } from '@/components/admin/AdminUI';
import { Button } from '@/components/ui/button';
import EngineerEditModal from '@/components/admin/EngineerEditModal';

export default function SectionList({
  entityName, title, subtitle, columns, searchFields = [], filter = {},
  sort = '-created_date', limit = 500, actions, portalMode = 'admin',
}) {
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState('');
  const [editRecord, setEditRecord] = useState(null);

  const load = async () => {
    try {
      const result = filter && Object.keys(filter).length > 0
        ? await base44.entities[entityName].filter(filter, sort, limit)
        : await base44.entities[entityName].list(sort, limit);
      setRows(result || []);
    } catch { setRows([]); }
  };

  useEffect(() => { load(); }, [JSON.stringify(filter)]);

  if (!rows) return <Spinner label={`Loading ${title}…`} />;

  const filtered = query
    ? rows.filter((r) => searchFields.some((f) => {
        const v = r[f]; return v && String(v).toLowerCase().includes(query.toLowerCase());
      }))
    : rows;

  return (
    <div>
      <PageTitle title={title} subtitle={subtitle} right={actions} />
      <Card className="p-4">
        {searchFields.length > 0 && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-10 pr-4 h-10 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-solar outline-none"
            />
          </div>
        )}
        <DataTable
          columns={portalMode === 'engineer' ? [...columns, { key: '_edit', label: '', render: (r) => (
            <Button size="sm" variant="outline" className="h-8" onClick={(e) => { e.stopPropagation(); setEditRecord(r); }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          ) }] : columns}
          rows={filtered}
          emptyText={`No ${title.toLowerCase()} found.`}
        />
      </Card>
      {editRecord && (
        <EngineerEditModal
          entityName={entityName}
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}
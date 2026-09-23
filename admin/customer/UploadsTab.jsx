import { useEffect, useState } from 'react';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Spinner, Empty } from '@/components/customer/ui';

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogg)$/i;

export default function UploadsTab({ customer }) {
  const [items, setItems] = useState(null);

  const load = async () => {
    let list = [];
    try {
      if (customer.user_id) {
        list = await base44.entities.ProjectMilestone.filter({ user_id: customer.user_id }, '-created_date', 300);
      } else {
        const projects = await base44.entities.Project.filter({ customer_id: customer.id }, '-created_date', 50);
        for (const p of (projects || [])) {
          const ms = await base44.entities.ProjectMilestone.filter({ project_id: p.id }, '-created_date', 300);
          list = list.concat(ms || []);
        }
      }
    } catch {
      list = [];
    }
    setItems(list.filter((m) => m.attachment_url));
  };

  useEffect(() => { load(); }, [customer.id, customer.user_id]);

  if (!items) return <Spinner label="Loading uploads…" />;

  if (items.length === 0) {
    return (
      <Empty
        icon={ImageIcon}
        title="No uploads yet"
        description="Photos and videos uploaded by engineers/CSRs during project milestones will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((m) => {
        const isVideo = VIDEO_EXT.test(m.attachment_url || '');
        return (
          <a key={m.id} href={m.attachment_url} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border bg-card group relative">
            {isVideo ? (
              <video src={m.attachment_url} controls className="w-full h-32 object-cover bg-black" />
            ) : (
              <>
                <Image src={m.attachment_url} alt={m.stage_label || m.stage} fittingType="fill" className="w-full h-32" />
                <span className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition bg-background/90 rounded-full p-2 shadow"><ExternalLink className="w-4 h-4 text-foreground" /></span>
                </span>
              </>
            )}
            <div className="p-2">
              <p className="text-xs font-semibold truncate">{m.stage_label || m.stage}</p>
              {m.completed_date && <p className="text-[10px] text-muted-foreground">{m.completed_date}</p>}
            </div>
          </a>
        );
      })}
    </div>
  );
}
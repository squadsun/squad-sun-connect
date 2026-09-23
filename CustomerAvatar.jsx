import { Image } from '@/components/ui/image';

export default function CustomerAvatar({ customer, size = 44, showStatus = true, className = '' }) {
  const initials = (customer?.full_name || 'C').charAt(0).toUpperCase();
  return (
    <div
      className={`rounded-full bg-ink grid place-items-center shrink-0 relative overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      {customer?.profile_photo ? (
        <Image src={customer.profile_photo} fittingType="fill" className="w-full h-full" />
      ) : (
        <span className="text-white font-semibold" style={{ fontSize: size * 0.4 }}>{initials}</span>
      )}
      {showStatus && (
        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
      )}
    </div>
  );
}
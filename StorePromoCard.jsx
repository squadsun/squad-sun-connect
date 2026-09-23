import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Image } from '@/components/ui/image';

const STORE_IMG = 'https://media.base44.com/images/public/6a7c03ede0a9277673980b84/4b4a497a9_generated_image.png';

export default function StorePromoCard() {
  return (
    <div className="rounded-2xl bg-ink text-white overflow-hidden shadow-lg shadow-black/20 mb-6 flex">
      <div className="p-4 flex-1 min-w-0">
        <p className="text-[11px] font-bold tracking-widest text-solar uppercase">S-Quad Sun Store</p>
        <h3 className="font-display font-extrabold text-lg leading-tight mt-1.5">
          Upgrade Your Energy Independence
        </h3>
        <p className="text-xs text-white/60 mt-1.5">
          Add panels, expand battery backup, extend your warranty, and more.
        </p>
        <Link
          to="/add-ons"
          className="inline-flex items-center gap-1.5 mt-3.5 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-ink font-bold text-xs shadow-md active:scale-95 transition"
        >
          Explore add-ons <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="w-28 shrink-0 relative">
        <Image src={STORE_IMG} alt="Solar battery" fittingType="fill" className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink to-transparent" />
      </div>
    </div>
  );
}
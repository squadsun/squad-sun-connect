import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerData } from '@/lib/customerDataContext';
import { base44 } from '@/api/base44Client';
import { createSupportTicket } from '@/lib/support';
import SupportIcon from '@/components/SupportIcon';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

const STORAGE_KEY = 'squad-chathead-pos';
const SIZE = 64;

function loadPos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { right: 16, bottom: 96 };
}

/**
 * Movable floating chat head for the customer portal.
 * - Drag anywhere on screen (pointer events — works on mouse + touch).
 * - Cannot be dragged off-screen (clamped to viewport bounds).
 * - Position persists across sessions via localStorage.
 * - Red badge shows unread staff messages.
 * - Tap (without dragging) opens the support conversation.
 */
export default function DraggableChatHead() {
  const navigate = useNavigate();
  const { customer, project } = useCustomerData();
  const unread = useUnreadMessages('customer');
  const [pos, setPos] = useState(loadPos);
  const dragRef = useRef(null);
  const posRef = useRef(pos);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const clamp = useCallback((right, bottom) => {
    const maxRight = window.innerWidth - SIZE - 8;
    const maxBottom = window.innerHeight - SIZE - 80;
    return {
      right: Math.max(8, Math.min(maxRight, right)),
      bottom: Math.max(80, Math.min(maxBottom, bottom)),
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (!customer) {
      navigate('/support');
      return;
    }
    try {
      const tickets = await base44.entities.SupportTicket.filter(
        { customer_id: customer.id },
        '-created_date',
        50
      );
      const active = (tickets || []).find((t) => !['closed', 'resolved'].includes(t.status));
      if (active) {
        navigate('/support/' + active.id);
      } else {
        const t = await createSupportTicket(customer, project, {
          subject: `Chat with ${customer.full_name || 'Customer'}`,
          description: '',
          category: 'general_inquiry',
        });
        navigate('/support/' + t.id);
      }
    } catch {
      navigate('/support');
    }
  }, [customer, project, navigate]);

  const handleDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRight: posRef.current.right,
      startBottom: posRef.current.bottom,
      moved: false,
    };
  };

  useEffect(() => {
    const move = (e) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
      const newRight = dragRef.current.startRight - dx;
      const newBottom = dragRef.current.startBottom - dy;
      const clamped = clamp(newRight, newBottom);
      posRef.current = clamped;
      setPos(clamped);
    };
    const up = () => {
      if (!dragRef.current) return;
      const wasMoved = dragRef.current.moved;
      dragRef.current = null;
      if (wasMoved) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current));
        } catch {}
      } else {
        handleClick();
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [clamp, handleClick]);

  // Re-clamp on viewport resize so the head never goes off-screen.
  useEffect(() => {
    const onResize = () => setPos((p) => clamp(p.right, p.bottom));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clamp]);

  return (
    <button
      onPointerDown={handleDown}
      aria-label="Customer Support — drag to move, tap to chat"
      className="fixed z-50 grid place-items-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl shadow-black/30 hover:scale-105 transition active:scale-95 touch-none select-none cursor-grab"
      style={{ right: `${pos.right}px`, bottom: `${pos.bottom}px` }}
    >
      <SupportIcon className="w-full h-full" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center border-2 border-white shadow-md animate-pulse">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
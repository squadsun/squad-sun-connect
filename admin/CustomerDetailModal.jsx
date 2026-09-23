import { Modal } from '@/components/customer/ui';
import CustomerDetailPanel from '@/components/admin/customer/CustomerDetailPanel';

export default function CustomerDetailModal({ customer, onClose, onUpdated }) {
  if (!customer) return null;
  return (
    <Modal open={!!customer} onClose={onClose} title={customer.full_name}>
      <CustomerDetailPanel customer={customer} onUpdated={onUpdated} />
    </Modal>
  );
}
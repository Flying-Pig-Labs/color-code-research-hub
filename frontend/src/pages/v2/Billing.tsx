import { useState } from 'react';
import { useBalance } from '@/hooks/v2';
import { v2Api } from '@/services/v2/api';
import { Button } from '@/components/ui/button';

const Billing: React.FC = () => {
  const { data } = useBalance();
  const [qty, setQty] = useState(1);
  const buy = async () => {
    const resp = await v2Api.createCheckoutSession(qty, window.location.origin + '/v2/billing', window.location.origin + '/v2/billing');
    if (resp?.checkoutUrl) {
      window.location.href = resp.checkoutUrl;
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <div>Credits: {data?.credits ?? 0}</div>
      <div className="flex items-center space-x-2">
        <input type="number" min={1} value={qty} onChange={e => setQty(parseInt(e.target.value) || 1)} className="border p-1 w-20" />
        <Button onClick={buy}>Buy Credits</Button>
      </div>
    </div>
  );
};

export default Billing;

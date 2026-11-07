import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAdminUser, useAdminAdjustCredits } from '@/hooks/v2';
import { Button } from '@/components/ui/button';

const AdminUserDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { data } = useAdminUser(userId!);
  const adjust = useAdminAdjustCredits(userId!);
  const [amount, setAmount] = useState(1);
  const [reason, setReason] = useState('manual_adjust');

  const submit = () => {
    adjust.mutate({ amount, reason });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">User Detail</h1>
      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
      <div className="space-x-2">
        <input type="number" value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="border p-1 w-24" />
        <input value={reason} onChange={e => setReason(e.target.value)} className="border p-1" />
        <Button onClick={submit}>Adjust Credits</Button>
      </div>
    </div>
  );
};

export default AdminUserDetail;

import { useAdminMetrics } from '@/hooks/v2';

const AdminDashboard: React.FC = () => {
  const { data } = useAdminMetrics();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default AdminDashboard;

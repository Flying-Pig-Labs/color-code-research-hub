import { useAdminUsers } from '@/hooks/v2';
import { Link } from 'react-router-dom';

const AdminUsers: React.FC = () => {
  const { data } = useAdminUsers();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      {data && data.length > 0 ? (
        <ul className="space-y-2">
          {data.map((u: any) => (
            <li key={u.userId} className="border p-2 rounded">
              <Link to={`/v2/admin/users/${u.userId}`}>{u.email} – {u.credits} credits</Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No users.</p>
      )}
    </div>
  );
};

export default AdminUsers;

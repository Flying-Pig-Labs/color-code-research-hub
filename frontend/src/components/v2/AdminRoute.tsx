import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/useAdmin';

interface Props { children: JSX.Element; }

const AdminRoute: React.FC<Props> = ({ children }) => {
  const isAdmin = useIsAdmin();
  if (!isAdmin) {
    return <Navigate to="/v2/projects" replace />;
  }
  return children;
};

export default AdminRoute;

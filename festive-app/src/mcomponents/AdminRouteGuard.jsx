import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

const AdminRouteGuard = ({ children }) => {
  const { member } = useAuthStore();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!member || member.role !== 'ADMIN') {
      setShowAlert(true);
    }
  }, [member]);

  if (!member || member.role !== 'ADMIN') {
    if (showAlert) {
      alert('권한이 없습니다');
    }
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default AdminRouteGuard; 
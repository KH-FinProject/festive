import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import axiosApi from '../api/axiosAPI';

const AdminRouteGuard = ({ children }) => {
  const [serverRole, setServerRole] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    axiosApi.get('/admin/me')
      .then(res => {
        setServerRole(res.data.role);
        setChecked(true);
      })
      .catch(() => {
        setServerRole(null);
        setChecked(true);
      });
  }, []);

  if (!checked) return null; // 로딩 중에는 아무것도 렌더링하지 않음

  if (serverRole !== 'ADMIN') {
    alert('권한이 없습니다');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRouteGuard; 
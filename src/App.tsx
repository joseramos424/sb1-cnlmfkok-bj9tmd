import { Routes, Route, Navigate } from 'react-router-dom';
import UserList from './pages/UserList';
import TaskBoard from './pages/TaskBoard';
import PasswordGate from './pages/PasswordGate';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PasswordGate />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:userId"
        element={
          <ProtectedRoute>
            <TaskBoard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
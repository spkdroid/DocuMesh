import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ContentEditor from './pages/ContentEditor';
import Publications from './pages/Publications';
import Reviews from './pages/Reviews';
import Team from './pages/Team';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="content/new" element={<ContentEditor />} />
        <Route path="content/:id" element={<ContentEditor />} />
        <Route path="publications" element={<Publications />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="team" element={<Team />} />
      </Route>
    </Routes>
  );
}

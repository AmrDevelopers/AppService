import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Layout from './components/Layout';
import TaskPage from './pages/Task';
import ServiceReport from './pages/Servicereportform';
import JobCreation from './pages/JobCreation';
import Inspection from './pages/inspections';
import Quotation from './pages/Quotation';
import PendingApproval from './pages/PendingApproval';
import ReadyForDelivery from './pages/ReadyForDelivery';
import JobHistory from './pages/JobHistory';
import UserManagement from './pages/UserManagement';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="jobs/create" element={<JobCreation />} />
              <Route path="tasks" element={<TaskPage />} />
              <Route path="service-report" element={<ServiceReport />} />
              <Route path="service-reports/new" element={<ServiceReport />} />
              <Route path="jobs/inspection" element={<Inspection />} />
              <Route path="jobs/quotation" element={<Quotation />} />
              <Route path="jobs/pending-approval" element={<PendingApproval />} />
              <Route path="jobs/ready-for-delivery" element={<ReadyForDelivery />} />
              <Route path="jobs/history" element={<JobHistory />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;

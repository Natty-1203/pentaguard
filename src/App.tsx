import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { TenantProvider } from './lib/TenantContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import PoliciesPage from './pages/Policies';
import ReportsPage from './pages/Reports';
import ClaimDetailPage from './pages/ClaimDetail';
import QuoteWizardPage from './pages/QuoteWizard';
import PaymentsPage from './pages/Payments';
import CustomersPage from './pages/Customers';
import CompanyRegistryPage from './pages/admin/CompanyRegistry';
import SubscriptionPlansPage from './pages/admin/SubscriptionPlans';
import SaaSInvoicesPage from './pages/admin/Invoices';
import SystemSettingsPage from './pages/admin/SystemSettings';
import PolicyDetailPage from './pages/PolicyDetail';
import ClaimWorkflowPage from './pages/ClaimWorkflow';
import CustomerProfilePage from './pages/CustomerProfile';
import DocumentsPage from './pages/Documents';
import AgentsPage from './pages/Agents';
import AgentProfilePage from './pages/AgentProfile';
import AssetsPage from './pages/Assets';
import ClaimsPage from './pages/Claims';
import PaymentSchedulesPage from './pages/PaymentSchedules';
import NotificationsPage from './pages/Notifications';
import BranchesPage from './pages/Branches';
import SettingsPage from './pages/Settings';
import WorkflowsOverviewPage from './pages/WorkflowsOverview';

export default function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:id" element={<CustomerProfilePage />} />
              <Route path="branches" element={<BranchesPage />} />
              <Route path="agents" element={<AgentsPage />} />
              <Route path="agents/:id" element={<AgentProfilePage />} />
              <Route path="policies" element={<PoliciesPage />} />
              <Route path="policies/:id" element={<PolicyDetailPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="quotes/new" element={<QuoteWizardPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="payment-schedules" element={<PaymentSchedulesPage />} />
              <Route path="claims" element={<ClaimsPage />} />
              <Route path="claims/workflow" element={<WorkflowsOverviewPage />} />
              <Route path="claims/:id" element={<ClaimDetailPage />} />
              <Route path="claims/:id/workflow" element={<ClaimWorkflowPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="/admin" element={<ProtectedRoute allowedRoles={['super_admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/companies" replace />} />
              <Route path="companies" element={<CompanyRegistryPage />} />
              <Route path="plans" element={<SubscriptionPlansPage />} />
              <Route path="invoices" element={<SaaSInvoicesPage />} />
              <Route path="settings" element={<SystemSettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  );
}

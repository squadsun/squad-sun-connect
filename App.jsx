import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import InternalLogin from '@/pages/InternalLogin';
import { CustomerDataProvider } from '@/lib/customerDataContext';
import { VoiceCallProvider, GlobalVoiceCallOverlay } from '@/lib/VoiceCallContext';
import CustomerAppLayout from '@/components/customer/CustomerAppLayout';
import Home from '@/pages/customer/Home';
import Project from '@/pages/customer/Project';
import Profile from '@/pages/customer/Profile';
import Notifications from '@/pages/customer/Notifications';
import Booking from '@/pages/customer/Booking';
import Support from '@/pages/customer/Support';
import Services from '@/pages/customer/Services';
import Vouchers from '@/pages/customer/Vouchers';
import Warranty from '@/pages/customer/Warranty';
import Documents from '@/pages/customer/Documents';
import MySolar from '@/pages/customer/MySolar';
import SavingsDetails from '@/pages/customer/SavingsDetails';
import AddOns from '@/pages/customer/AddOns';
import Billing from '@/pages/customer/Billing';
import AdminRoute from '@/components/AdminRoute';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import InboxLayout from '@/components/admin/InboxLayout';
import AdminCustomers from '@/pages/admin/Customers';
import EnrollCustomer from '@/pages/admin/EnrollCustomer';
import EnrollStaff from '@/pages/admin/EnrollStaff';
import AdminProjects from '@/pages/admin/Projects';
import AdminTickets from '@/pages/admin/Tickets';
import AdminTicketConversation from '@/pages/admin/TicketConversation';
import AdminWarranties from '@/pages/admin/Warranties';
import AdminSchedule from '@/pages/admin/Schedule';
import AdminCalendar from '@/pages/admin/Calendar';
import AdminVouchers from '@/pages/admin/Vouchers';
import SupportConversation from '@/pages/customer/SupportConversation';
import ProjectMilestones from '@/pages/admin/ProjectMilestones';
import InboxConversation from '@/pages/admin/InboxConversation';
import AdminTechnicalTickets from '@/pages/admin/TechnicalTickets';
import AdminMaintenance from '@/pages/admin/Maintenance';
import AdminCleaning from '@/pages/admin/Cleaning';
import AdminDocuments from '@/pages/admin/Documents';
import AdminContracts from '@/pages/admin/Contracts';
import AdminBilling from '@/pages/admin/Billing';
import AdminAuditLog from '@/pages/admin/AuditLog';
import AdminCallLogs from '@/pages/admin/CallLogs';
import AdminPendingEdits from '@/pages/admin/PendingEdits';
import AdminUsers from '@/pages/admin/Users';
import EngineerRoute from '@/components/EngineerRoute';
import EngineerLayout from '@/components/admin/EngineerLayout';
import CSRRoute from '@/components/CSRRoute';
import CSRLayout from '@/components/csr/CSRLayout';
import CSRDashboard from '@/pages/csr/Dashboard';
import CSRCalendar from '@/pages/csr/Calendar';
import EngineerDashboard from '@/pages/engineer/Dashboard';
import EngineerProjects from '@/pages/engineer/Projects';
import EngineerTickets from '@/pages/engineer/Tickets';
import EngineerMaintenance from '@/pages/engineer/Maintenance';
import EngineerCleaning from '@/pages/engineer/Cleaning';
import EngineerServiceReports from '@/pages/engineer/ServiceReports';
import EngineerCalendar from '@/pages/engineer/Calendar';
import EngineerSchedule from '@/pages/engineer/Schedule';

function App() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => document.documentElement.classList.toggle('dark', mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <VoiceCallProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/portal" element={<InternalLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
              <Route element={<CustomerDataProvider><CustomerAppLayout /></CustomerDataProvider>}>
                <Route path="/" element={<Home />} />
                <Route path="/project" element={<Project />} />
                <Route path="/booking" element={<Booking />} />
                <Route path="/services" element={<Services />} />
                <Route path="/support" element={<Support />} />
                <Route path="/support/:ticketId" element={<SupportConversation />} />
                <Route path="/vouchers" element={<Vouchers />} />
                <Route path="/warranty" element={<Warranty />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/my-solar" element={<MySolar />} />
                <Route path="/savings-details" element={<SavingsDetails />} />
                <Route path="/add-ons" element={<AddOns />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
            <Route element={<AdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/inbox" element={<InboxLayout />}>
                  <Route index element={<div className="hidden md:flex h-full items-center justify-center text-muted-foreground text-sm">Select a conversation to start messaging</div>} />
                  <Route path=":ticketId" element={<InboxConversation />} />
                </Route>
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/enroll" element={<EnrollCustomer />} />
                <Route path="/admin/enroll-staff" element={<EnrollStaff />} />
                <Route path="/admin/projects" element={<AdminProjects />} />
                <Route path="/admin/projects/:projectId" element={<ProjectMilestones />} />
                <Route path="/admin/tickets" element={<AdminTickets />} />
                <Route path="/admin/tickets/:ticketId" element={<AdminTicketConversation />} />
                <Route path="/admin/warranties" element={<AdminWarranties />} />
                <Route path="/admin/schedule" element={<AdminSchedule />} />
                <Route path="/admin/calendar" element={<AdminCalendar />} />
                <Route path="/admin/vouchers" element={<AdminVouchers />} />
                <Route path="/admin/technical-tickets" element={<AdminTechnicalTickets />} />
                <Route path="/admin/maintenance" element={<AdminMaintenance />} />
                <Route path="/admin/cleaning" element={<AdminCleaning />} />
                <Route path="/admin/documents" element={<AdminDocuments />} />
                <Route path="/admin/contracts" element={<AdminContracts />} />
                <Route path="/admin/billing" element={<AdminBilling />} />
                <Route path="/admin/audit-log" element={<AdminAuditLog />} />
            <Route path="/admin/call-logs" element={<AdminCallLogs />} />
                <Route path="/admin/pending-edits" element={<AdminPendingEdits />} />
                <Route path="/admin/users" element={<AdminUsers />} />
              </Route>
            </Route>
            <Route element={<EngineerRoute />}>
              <Route element={<EngineerLayout />}>
                <Route path="/engineer" element={<EngineerDashboard />} />
                <Route path="/engineer/projects" element={<EngineerProjects />} />
                <Route path="/engineer/projects/:projectId" element={<ProjectMilestones basePath="/engineer/projects" />} />
                <Route path="/engineer/tickets" element={<EngineerTickets />} />
                <Route path="/engineer/maintenance" element={<EngineerMaintenance />} />
                <Route path="/engineer/cleaning" element={<EngineerCleaning />} />
                <Route path="/engineer/service-reports" element={<EngineerServiceReports />} />
                <Route path="/engineer/schedule" element={<EngineerSchedule />} />
                <Route path="/engineer/calendar" element={<EngineerCalendar />} />
              </Route>
            </Route>
            <Route element={<CSRRoute />}>
              <Route element={<CSRLayout />}>
                <Route path="/CSR" element={<CSRDashboard />} />
                <Route path="/CSR/enroll" element={<EnrollCustomer />} />
                <Route path="/CSR/customers" element={<AdminCustomers basePath="/CSR" />} />
                <Route path="/CSR/projects" element={<AdminProjects basePath="/CSR/projects" />} />
                <Route path="/CSR/projects/:projectId" element={<ProjectMilestones basePath="/CSR/projects" />} />
                <Route path="/CSR/inbox" element={<InboxLayout basePath="/CSR/inbox" />}>
                  <Route index element={<div className="hidden md:flex h-full items-center justify-center text-muted-foreground text-sm">Select a conversation to start messaging</div>} />
                  <Route path=":ticketId" element={<InboxConversation basePath="/CSR/inbox" />} />
                </Route>
                <Route path="/CSR/schedule" element={<AdminSchedule />} />
                <Route path="/CSR/calendar" element={<CSRCalendar />} />
              </Route>
            </Route>
            <Route path="*" element={<PageNotFound />} />
          </Routes>
          <GlobalVoiceCallOverlay />
          </VoiceCallProvider>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
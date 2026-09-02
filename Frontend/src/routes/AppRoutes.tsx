import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '../layouts/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { AnalyticsPage } from '../pages/app/AnalyticsPage';
import { BudgetPage } from '../pages/app/BudgetPage';
import { InventoryPage } from '../pages/app/InventoryPage';
import { NotificationsPage } from '../pages/app/NotificationsPage';
import { OverviewPage } from '../pages/app/OverviewPage';
import { ProcurementPage } from '../pages/app/ProcurementPage';
import { ProjectDetailPage } from '../pages/app/ProjectDetailPage';
import { ProjectsPage } from '../pages/app/ProjectsPage';
import { ReportsPage } from '../pages/app/ReportsPage';
import { ResourcesPage } from '../pages/app/ResourcesPage';
import { SettingsPage } from '../pages/app/SettingsPage';
import { SiteProgressPage } from '../pages/app/SiteProgressPage';
import { UsersPage } from '../pages/app/UsersPage';
import { WorkforcePage } from '../pages/app/WorkforcePage';

/**
 * Route table.
 *
 * Public marketing and auth routes sit at the root; everything under
 * `/app` is wrapped by `AppLayout`, which enforces the session guard.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="/app/overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:code" element={<ProjectDetailPage />} />
        <Route path="site-progress" element={<SiteProgressPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="workforce" element={<WorkforcePage />} />
        <Route path="procurement" element={<ProcurementPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

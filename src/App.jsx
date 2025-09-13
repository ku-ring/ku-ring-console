import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import FeedbacksPage, { feedbacksLoader } from './pages/FeedbacksPage';
import NoticesPage from './pages/NoticesPage';
import ReportsPage from './pages/ReportsPage';
import TestNoticesPage from './pages/TestNoticesPage.jsx';
import ProdNoticesPage from './pages/ProdNoticesPage.jsx';
import ScheduledAlertsPage from './pages/ScheduledAlertsPage.jsx';
import ServerStatusDashboard from './components/ServerStatusDashboard';
import { checkAuthLoader, isTokenValid } from './util/auth';
import {authAction} from "./pages/Authentication.js";

// 초기 리다이렉트 컴포넌트
function InitialRedirect() {
  return isTokenValid() ? <Navigate to="/" replace /> : <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    action: authAction,
  },
  {
    path: '/',
    element: <DashboardLayout />,
    loader: checkAuthLoader,
    children: [
      {
        index: true,
        element: <ServerStatusDashboard />,
      },
      {
        path: 'dashboard/feedbacks',
        element: <FeedbacksPage />,
        loader: feedbacksLoader,
      },
      {
        path: 'dashboard/notices',
        element: <NoticesPage />,
      },
      {
        path: 'dashboard/reports',
        element: <ReportsPage />,
      },
      {
        path: 'dashboard/task-notices',
        element: <TestNoticesPage />,
      },
      {
        path: 'dashboard/custom-notices',
        element: <ProdNoticesPage />,
      },
      {
        path: 'dashboard/scheduled-alerts',
        element: <ScheduledAlertsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <InitialRedirect />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

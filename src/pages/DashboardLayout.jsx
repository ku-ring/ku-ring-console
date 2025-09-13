import { Outlet } from 'react-router-dom';
import AppBar from '../components/AppBar';
import LeftNavigation from '../components/LeftNavigation';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar />
      <div className="flex">
        <LeftNavigation />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
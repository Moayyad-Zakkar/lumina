import { createBrowserRouter, redirect, RouterProvider } from 'react-router';
import './App.css';

import Home from './ui/Pages/Home';
import About from './ui/Pages/About';
import Register /*, { action as registerUserAction } */ from './ui/Pages/Register';
import Login from './ui/Pages/Login';
import Layout from './ui/Pages/Layout';
import Features from './ui/Pages/Features';
import Welcome from './ui/Pages/Welcome';
import UserDashboard from './ui/Pages/UserDashboard';

import UpdatePassword from './ui/Pages/UpdatePassword';
import ResetPassword from './ui/Pages/ResetPassword';
import CasesPage from './ui/Pages/CasesPage-v2';
import CaseSubmit from './ui/Pages/CaseSubmit';
import CasePage from './ui/Pages/CasePage';
import { userCaseLoader } from './ui/loaders/userCaseLoader';
import { RequireRole } from './ui/layouts/RequireRole';
import AdminDashboard from './ui/Pages/admin/AdminDashboard';
import ProtectedRoute from './ui/layouts/ProtectedRoute';
import UserLayout from './ui/layouts/UserLayout';
import AdminLayout from './ui/layouts/AdminLayout';
import { userLayoutLoader } from './ui/loaders/userLayoutLoader';
import { adminLayoutLoader } from './ui/loaders/adminLayoutLoader';
import NotFound from './ui/Pages/NotFound';
import UnauthorizedPage from './ui/Pages/UnauthorizedPage';
import { userDashboardLoader } from './ui/loaders/userdashboardLoader';
import SettingsPage from './ui/Pages/SettingsPage';
import ProfilePage from './ui/Pages/ProfilePage';
import { adminDashboardLoader } from './ui/loaders/adminDashboardLoader';
import AdminCasesPage from './ui/Pages/admin/AdminCasesPage';
import AdminCasePage from './ui/Pages/admin/AdminCasePage';
import { adminCaseLoader } from './ui/loaders/adminCaseLoader';
import AdminDoctorsPage from './ui/Pages/admin/AdminDoctorsPage';
import AdminDoctorDetailsPage from './ui/Pages/admin/AdminDoctorDetailsPage';
import { adminDoctorsLoader } from './ui/loaders/adminDoctorsLoader';
import { adminDoctorDetailsLoader } from './ui/loaders/adminDoctorDetailsLoader';
import AdminSettingsPage from './ui/Pages/admin/AdminSettingsPage';

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        element: <Home />,
        path: '/',
      },
      {
        element: <About />,
        path: '/about',
      },
      {
        element: <Features />,
        path: '/features',
      },
    ],
  },
  {
    element: <Login />,
    path: '/login',
  },
  {
    element: <ResetPassword />,
    path: '/reset-password',
  },
  {
    element: <UpdatePassword />,
    path: '/update-password',
  },
  {
    element: <Register />,
    path: '/register',
  },
  {
    element: <Welcome />,
    path: '/register/welcome',
  },
  {
    element: (
      <ProtectedRoute>
        <RequireRole role="user">
          <UserLayout />
        </RequireRole>
      </ProtectedRoute>
    ),
    loader: userLayoutLoader,
    children: [
      {
        element: <UserDashboard />,
        path: '/app/dashboard',
        loader: userDashboardLoader,
      },
      {
        element: <CasesPage />,
        path: '/app/cases',
      },
      {
        path: '/app/cases/:caseId',
        element: <CasePage />,
        loader: userCaseLoader,
      },
      {
        element: <CaseSubmit />,
        path: '/app/cases/new',
      },
      {
        path: '/app/profile',
        element: <ProfilePage />,
      },
      {
        path: '/app/settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <RequireRole role="admin">
          <AdminLayout />
        </RequireRole>
      </ProtectedRoute>
    ),
    loader: adminLayoutLoader,
    children: [
      {
        element: <AdminDashboard />,
        path: '/admin/dashboard',
        loader: adminDashboardLoader,
      },
      {
        element: <AdminCasesPage />,
        path: '/admin/cases',
        //loader: adminCasesLoader,
      },
      {
        path: '/admin/cases/:caseId',
        element: <AdminCasePage />,
        loader: adminCaseLoader,
      },
      {
        path: '/admin/doctors',
        element: <AdminDoctorsPage />,
        loader: adminDoctorsLoader,
      },
      {
        path: '/admin/doctors/:doctorId',
        element: <AdminDoctorDetailsPage />,
        loader: adminDoctorDetailsLoader,
      },
      {
        path: '/admin/settings',
        element: <AdminSettingsPage />,
      },
    ],
  },
  {
    path: '/app',
    loader: () => redirect('/app/dashboard'),
  },
  {
    path: '/admin',
    loader: () => redirect('/admin/dashboard'),
  },
  {
    path: '*',
    element: <NotFound />,
  },
  {
    path: '/unauthorized',
    element: <UnauthorizedPage />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

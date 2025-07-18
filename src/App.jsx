import { createBrowserRouter, RouterProvider } from 'react-router';
import './App.css';

import Home from './ui/Pages/Home';
import About from './ui/Pages/About';
import Register /*, { action as registerUserAction } */ from './ui/Pages/Register';
import Login from './ui/Pages/Login';

import AppLayout from './ui/Pages/AppLayout';
import Features from './ui/Pages/Features';
import Welcome from './ui/Pages/Welcome';
import Dashboard from './ui/Pages/dashboard';

import { useState } from 'react';
import supabase from './helper/supabaseClient';
import { useEffect } from 'react';
import UpdatePassword from './ui/Pages/UpdatePassword';
import ResetPassword from './ui/Pages/ResetPassword';
import CasesList from './ui/Pages/CasesList';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    element: <AppLayout />,
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
    path: '/Register',
    /*action: registerUserAction,*/
  },
  {
    element: <Welcome />,
    path: '/register/welcome',
  },
  {
    element: (
      <ProtectedRoute>
        <Dashboard />,
        <CasesList />,
      </ProtectedRoute>
    ),
    path: '/app/dashboard',
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

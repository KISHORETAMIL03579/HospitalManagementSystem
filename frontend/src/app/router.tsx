import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { PatientListPage } from '../features/patients/pages/PatientListPage';
import { PatientCreatePage } from '../features/patients/pages/PatientCreatePage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/patients" replace />,
      },
      {
        path: 'patients',
        element: <PatientListPage />,
      },
      {
        path: 'patients/new',
        element: <PatientCreatePage />,
      },
    ],
  },
]);


import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
import paths, { rootPaths } from './paths';

const App = lazy(() => import('App'));
const MainLayout = lazy(() => import('layouts/main-layout'));
const AuthLayout = lazy(() => import('layouts/auth-layout'));
const Dashboard = lazy(() => import('pages/dashboard/Dashboard'));
const SignIn = lazy(() => import('pages/authentication/SignIn'));
const SignUp = lazy(() => import('pages/authentication/SignUp'));
const BmsList = lazy(() => import('pages/bms/BmsList'));
const BmsForm = lazy(() => import('pages/bms/BmsForm'));
const BmsCollaborators = lazy(() => import('pages/bms/Collaborators'));
const PacksList = lazy(() => import('pages/packs/PacksList'));
const PackForm = lazy(() => import('pages/packs/PackForm'));
const PackDetail = lazy(() => import('pages/packs/PackDetail'));
const AlertsList = lazy(() => import('pages/alerts/AlertsList'));
const UsersManagement = lazy(() => import('pages/admin/UsersManagement'));
const BmsModelsManagement = lazy(() => import('pages/admin/BmsModelsManagement'));
const BmsVerification = lazy(() => import('pages/admin/BmsVerification'));
const Page404 = lazy(() => import('pages/errors/Page404'));

import PageLoader from 'components/loading/PageLoader';
import Progress from 'components/loading/Progress';
import ProtectedRoute from 'components/auth/ProtectedRoute';

export const routes = [
  {
    element: (
      <Suspense fallback={<Progress />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        path: rootPaths.root,
        element: (
          <ProtectedRoute>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: 'bms',
            element: <BmsList />,
          },
          {
            path: 'bms/form',
            element: <BmsForm />,
          },
          {
            path: 'bms/:bmsId/collaborators',
            element: <BmsCollaborators />,
          },
          {
            path: 'packs',
            element: <PacksList />,
          },
          {
            path: 'packs/form',
            element: <PackForm />,
          },
          {
            path: 'packs/:packId',
            element: <PackDetail />,
          },
          {
            path: 'alerts',
            element: <AlertsList />,
          },
          {
            path: 'admin/users',
            element: (
              <ProtectedRoute roles={['admin']}>
                <UsersManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'admin/bms-models',
            element: (
              <ProtectedRoute roles={['admin']}>
                <BmsModelsManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'admin/bms-verification',
            element: (
              <ProtectedRoute roles={['admin']}>
                <BmsVerification />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: rootPaths.authRoot,
        element: <AuthLayout />,
        children: [
          {
            path: paths.signin,
            element: <SignIn />,
          },
          {
            path: paths.signup,
            element: <SignUp />,
          },
        ],
      },
      {
        path: '*',
        element: <Page404 />,
      },
    ],
  },
];

const router = createBrowserRouter(routes, { basename: '/' });

export default router;

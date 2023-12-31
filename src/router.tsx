import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import Wallet from '@/pages/wallet';
import Create from '@/pages/create';
import Recover from '@/pages/recover';
import Accounts from '@/pages/accounts';
import Popup from '@/pages/popup';
import Apps from '@/pages/apps';
// import RecoverPage from "@/pages/recover";
// import EditGuardians from "@/pages/guardians";
import Launch from '@/pages/launch';
import Asset from '@/pages/asset';
import Activity from '@/pages/activity';
import Security from '@/pages/security';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      // TODO, combine the routes
      { path: '/', element: <Wallet /> },
      { path: 'wallet', element: <Wallet /> },
      { path: 'accounts', element: <Accounts /> },
      { path: 'apps', element: <Apps /> },
      { path: 'launch', element: <Launch /> },
      { path: 'activity', element: <Activity /> },
      { path: 'asset', element: <Asset /> },
      { path: 'create', element: <Create /> },
      { path: 'recover', element: <Recover /> },
      { path: 'popup', element: <Popup />},
      { path: 'security', element: <Security /> },
      {
        /* <Route path="create" element={<CreatePage />} />
          <Route path="recover" element={<RecoverPage />} />
          <Route path="edit-guardians" element={<EditGuardians />} /> */
      },
    ],
  },
]);

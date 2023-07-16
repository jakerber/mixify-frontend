import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { RootPage } from './pages/Root';
import { HomePage } from './pages/Home';
import { QueuePage } from './pages/Queue';
import { SpotifyAuthPage } from './pages/SpotifyAuth';
import { MantineProvider } from '@mantine/core';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootPage />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: 'queue/:queueName', element: <QueuePage /> },
        { path: 'auth/spotify', element: <SpotifyAuthPage /> },
        { path: '*', element: <Navigate to='/' /> },
      ]
    }
  ]);

  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: 'dark',
        colors: {
          // override dark colors to change them for all components
          dark: [
            '#d5d7e0',
            '#acaebf',
            '#8c8fa3',
            '#666980',
            '#4d4f66',
            '#34354a',
            '#2b2c3d',
            '#1d1e30',
            '#0c0d21',
            '#01010a',
          ],
        },
      }}
    >
      <RouterProvider router={router} />
    </MantineProvider>
  );
}

export default App;

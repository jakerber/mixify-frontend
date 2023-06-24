import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { RootPage } from './pages/Root';
import { HomePage } from './pages/Home';
import { QueuePage } from './pages/Queue';
import { SpotifyAuthPage } from './pages/SpotifyAuth';

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <RootPage />,
      children: [
        { path: '/', element: <HomePage /> },
        { path: 'queue/:queueId', element: <QueuePage /> },
        { path: 'auth/spotify', element: <SpotifyAuthPage /> },
        { path: '*', element: <Navigate to='/' /> },
      ]
    }
  ]);

  return (
    <RouterProvider router={router} />
  );
}

export default App;

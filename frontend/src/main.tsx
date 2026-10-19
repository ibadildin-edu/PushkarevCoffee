import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router';

import { router } from './app/router';
import { store } from './app/store';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) throw new Error('#root element is missing in index.html');

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);

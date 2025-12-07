import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// ⬇⬇⬇ 添加这行：从 contexts 文件夹导入 AuthProvider
import { AuthProvider } from './contexts/AuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ⬇⬇⬇ 用 AuthProvider 包住 App */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

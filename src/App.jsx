import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardApp from './dashboard/DashboardApp';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard/*" element={<DashboardApp />} />
    </Routes>
  );
}

export default App;

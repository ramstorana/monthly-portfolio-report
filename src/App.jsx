import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Allocation from './pages/Allocation/Allocation';
import Performance from './pages/Performance/Performance';
import History from './pages/History/History';
import ProjectDetail from './pages/History/ProjectDetail';
import Settings from './pages/Settings/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Allocation />} /> {/* Renamed for clarity in URl match */}
        <Route path="/allocation" element={<Allocation />} /> {/* Legacy support */}
        <Route path="/history" element={<History />} />
        <Route path="/history/:year" element={<ProjectDetail />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;

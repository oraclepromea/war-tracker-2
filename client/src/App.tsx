import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { LiveNews } from './pages/LiveNews';
import { WarNews } from './pages/WarNews';
import { CountriesAndForces } from './components/CountriesAndForces';
import { WeaponsManagement } from './components/WeaponsManagement';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-tactical-bg">
        <Navigation />
        <main className="container mx-auto px-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/live" element={<LiveNews />} />
            <Route path="/events" element={<WarNews />} />
            <Route path="/countries" element={<CountriesAndForces />} />
            <Route path="/weapons" element={<WeaponsManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

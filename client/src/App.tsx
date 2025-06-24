import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LiveEventsFeed } from './components/LiveEventsFeed'
import { WarEvents } from './components/WarEvents'
import { CountriesAndForces } from './components/CountriesAndForces'
import { LiveNews } from './components/LiveNews'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-tactical-bg">
        <Routes>
          <Route path="/" element={<Navigate to="/events" replace />} />
          <Route path="/events" element={<WarEvents />} />
          <Route path="/feed" element={<LiveEventsFeed />} />
          <Route path="/countries" element={<CountriesAndForces />} />
          <Route path="/news" element={<LiveNews />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

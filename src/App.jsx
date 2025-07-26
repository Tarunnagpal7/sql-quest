
// import HomePage from './components/HomePage'
import HomePage from './pages/HomePage';
import LevelPage from './pages/LevelPage';
import MapScreen from './pages/MapScreen'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {

  return (
    <div>
      <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapScreen />} />
        <Route path="/level/:id" element = {<LevelPage />} />
        </Routes>
        </Router>
    </div>
  )
}

export default App

import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './app/styles/legacy.css';
import './app/styles/app.css';
import App from './app/App.jsx';

createRoot(document.getElementById('root')).render(<App />);

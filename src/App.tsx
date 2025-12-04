import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import './index.css';

const App = () => {
  return (
    <Router basename="/game">
      <AppRoutes />
    </Router>
  );
};

export default App;
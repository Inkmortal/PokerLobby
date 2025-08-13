import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { PostflopSolver } from './pages/solver/PostflopSolver';
import { PreflopSolver } from './pages/solver/PreflopSolver';
import { RangeBuilder } from './pages/solver/RangeBuilder';
import { Solutions } from './pages/solver/Solutions';
import { Practice } from './pages/training/Practice';
import { Campaign } from './pages/training/Campaign';
import { Review } from './pages/training/Review';
import { Library } from './pages/study/Library';
import { Explorer } from './pages/study/Explorer';
import { HandHistory } from './pages/analysis/HandHistory';
import { Ranked } from './pages/compete/Ranked';
import { Settings } from './pages/Settings';
import { ThemeProvider } from './contexts/ThemeContext';
import { ApiProvider } from './contexts/ApiContext';
import './styles/global.scss';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ApiProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              
              {/* Solver Routes */}
              <Route path="/solver/postflop" element={<PostflopSolver />} />
              <Route path="/solver/preflop" element={<PreflopSolver />} />
              <Route path="/solver/ranges" element={<RangeBuilder />} />
              <Route path="/solver/solutions" element={<Solutions />} />
              
              {/* Training Routes */}
              <Route path="/training/practice" element={<Practice />} />
              <Route path="/training/campaign" element={<Campaign />} />
              <Route path="/training/review" element={<Review />} />
              
              {/* Study Routes */}
              <Route path="/study/library" element={<Library />} />
              <Route path="/study/explorer" element={<Explorer />} />
              
              {/* Analysis Routes */}
              <Route path="/analysis/hands" element={<HandHistory />} />
              
              {/* Compete Routes */}
              <Route path="/compete/ranked" element={<Ranked />} />
              
              {/* Settings */}
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
        </Router>
      </ApiProvider>
    </ThemeProvider>
  );
};
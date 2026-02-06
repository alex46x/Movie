import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Catalog } from './pages/Catalog';
import { Details } from './pages/Details';
import { Admin } from './pages/Admin';
import { ContentType } from './types';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Catalog title="Latest Uploads" />} />
          {/* Added Browse Route for Navbar Filters */}
          <Route path="/browse" element={<Catalog title="Browse Content" />} />
          
          <Route path="/movies" element={<Catalog type={ContentType.Movie} title="Movies" />} />
          <Route path="/series" element={<Catalog type={ContentType.Series} title="TV Series" />} />
          <Route path="/anime" element={<Catalog type={ContentType.Cartoon} title="Anime & Cartoons" />} />
          <Route path="/content/:id" element={<Details />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
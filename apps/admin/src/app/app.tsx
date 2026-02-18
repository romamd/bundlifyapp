import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Products } from '../pages/Products';
import { Bundles } from '../pages/Bundles';
import { Analytics } from '../pages/Analytics';
import { ABTests } from '../pages/ABTests';
import { Integrations } from '../pages/Integrations';
import { Settings } from '../pages/Settings';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/products', label: 'Products' },
  { path: '/bundles', label: 'Bundles' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/ab-tests', label: 'A/B Tests' },
  { path: '/integrations', label: 'Integrations' },
  { path: '/settings', label: 'Settings' },
];

export function App() {
  const location = useLocation();

  return (
    <div>
      <nav
        style={{
          display: 'flex',
          gap: '4px',
          padding: '12px 20px',
          borderBottom: '1px solid #e1e3e5',
          backgroundColor: '#ffffff',
        }}
      >
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
              color:
                location.pathname === item.path ? '#008060' : '#6d7175',
              backgroundColor:
                location.pathname === item.path ? '#f1f8f5' : 'transparent',
              fontWeight: location.pathname === item.path ? 600 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/bundles" element={<Bundles />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ab-tests" element={<ABTests />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;

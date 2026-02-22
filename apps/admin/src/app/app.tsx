import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Products } from '../pages/Products';
import { Bundles } from '../pages/Bundles';
import { BundleWizardPage } from '../pages/BundleWizardPage';
import { Analytics } from '../pages/Analytics';
import { ABTests } from '../pages/ABTests';
import { Integrations } from '../pages/Integrations';
import { Customize } from '../pages/Customize';
import { Settings } from '../pages/Settings';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/products', label: 'Products' },
  { path: '/bundles', label: 'Bundles' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/ab-tests', label: 'A/B Tests' },
  { path: '/integrations', label: 'Integrations' },
  { path: '/customize', label: 'Customize' },
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
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                color: isActive ? '#008060' : '#6d7175',
                backgroundColor: isActive ? '#f1f8f5' : 'transparent',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/bundles" element={<Bundles />} />
        <Route path="/bundles/new" element={<BundleWizardPage />} />
        <Route path="/bundles/:id/edit" element={<BundleWizardPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/ab-tests" element={<ABTests />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/customize" element={<Customize />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;

import React, { useState } from 'react';
import { Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
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
  { path: '/', label: 'Dashboard', icon: '\u{1F4CA}', group: 'primary' },
  { path: '/bundles', label: 'Bundles', icon: '\u{1F4E6}', group: 'primary' },
  { path: '/products', label: 'Products', icon: '\u{1F6CD}', group: 'primary' },
  { path: '/analytics', label: 'Analytics', icon: '\u{1F4C8}', group: 'primary' },
  { path: '/ab-tests', label: 'A/B Tests', icon: '\u{1F9EA}', group: 'secondary' },
  { path: '/integrations', label: 'Integrations', icon: '\u{1F517}', group: 'secondary' },
  { path: '/customize', label: 'Customize', icon: '\u{1F3A8}', group: 'secondary' },
  { path: '/settings', label: 'Settings', icon: '\u{2699}', group: 'secondary' },
];

function NavLink({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      to={item.path}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        textDecoration: 'none',
        fontSize: '13px',
        color: isActive ? '#008060' : hovered ? '#202223' : '#5c5f62',
        backgroundColor: isActive ? '#f1f8f5' : hovered ? '#f6f6f7' : 'transparent',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: '14px', lineHeight: 1 }}>{item.icon}</span>
      {item.label}
    </Link>
  );
}

export function App() {
  const location = useLocation();

  const primaryItems = navItems.filter((i) => i.group === 'primary');
  const secondaryItems = navItems.filter((i) => i.group === 'secondary');

  return (
    <div>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '10px 20px',
          borderBottom: '1px solid #e1e3e5',
          backgroundColor: '#ffffff',
        }}
      >
        {primaryItems.map((item) => {
          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return <NavLink key={item.path} item={item} isActive={isActive} />;
        })}

        <div style={{ width: '1px', height: '20px', backgroundColor: '#e1e3e5', margin: '0 6px' }} />

        {secondaryItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return <NavLink key={item.path} item={item} isActive={isActive} />;
        })}
      </nav>

      {/* Breadcrumb for sub-pages */}
      <Breadcrumb />

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

function Breadcrumb() {
  const location = useLocation();
  const navigate = useNavigate();

  const crumbs: Array<{ label: string; path?: string }> = [];

  if (location.pathname === '/bundles/new') {
    crumbs.push({ label: 'Bundles', path: '/bundles' }, { label: 'Create New Bundle' });
  } else if (location.pathname.match(/^\/bundles\/[^/]+\/edit$/)) {
    crumbs.push({ label: 'Bundles', path: '/bundles' }, { label: 'Edit Bundle' });
  }

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        padding: '8px 20px',
        fontSize: '13px',
        color: '#5c5f62',
        borderBottom: '1px solid #f1f1f1',
        backgroundColor: '#fafafa',
      }}
    >
      {crumbs.map((crumb, idx) => (
        <span key={idx}>
          {idx > 0 && <span style={{ margin: '0 6px', color: '#c9cccf' }}>/</span>}
          {crumb.path ? (
            <button
              onClick={() => navigate(crumb.path!)}
              style={{
                background: 'none',
                border: 'none',
                color: '#008060',
                cursor: 'pointer',
                fontSize: '13px',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              {crumb.label}
            </button>
          ) : (
            <span style={{ color: '#202223', fontWeight: 500 }}>{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default App;

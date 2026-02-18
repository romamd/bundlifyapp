import React, { useState, useMemo } from 'react';
import {
  getShopDomain,
  getApiKey,
  getThemeSetupSteps,
} from '../../utils/theme-deep-links';

const STORAGE_KEY = 'bundlify:theme-setup';
const DISMISSED_KEY = 'bundlify:theme-setup-dismissed';

function loadCompletedSteps(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompletedSteps(steps: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...steps]));
}

function isDismissed(): boolean {
  return localStorage.getItem(DISMISSED_KEY) === 'true';
}

export function ThemeSetupBanner() {
  const [completed, setCompleted] = useState<Set<string>>(loadCompletedSteps);
  const [dismissed, setDismissed] = useState(isDismissed);

  const shop = useMemo(() => getShopDomain(), []);
  const apiKey = useMemo(() => getApiKey(), []);

  if (dismissed || !shop || !apiKey) return null;

  const steps = getThemeSetupSteps(shop, apiKey);
  const allDone = steps.every((s) => completed.has(s.id));

  const toggleStep = (id: string) => {
    const next = new Set(completed);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCompleted(next);
    saveCompletedSteps(next);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div
      style={{
        border: '1px solid #c9e8dc',
        borderRadius: '8px',
        backgroundColor: '#f1f8f5',
        padding: '16px 20px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}
      >
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600 }}>
            Enable Bundlify on your theme
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#6d7175' }}>
            Add widget blocks to your theme so customers can see your bundles.
            Click each button to open the theme editor, then click Save.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '12px',
            color: '#6d7175',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            textDecoration: 'underline',
            padding: '2px 0',
          }}
        >
          {allDone ? 'Dismiss' : 'Hide guide'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {steps.map((step) => {
          const done = completed.has(step.id);
          return (
            <div
              key={step.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                backgroundColor: done ? '#e3f1df' : '#ffffff',
                border: `1px solid ${done ? '#a3d9a5' : '#e1e3e5'}`,
                borderRadius: '6px',
              }}
            >
              <button
                type="button"
                onClick={() => toggleStep(step.id)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: `2px solid ${done ? '#008060' : '#c9cccf'}`,
                  backgroundColor: done ? '#008060' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: 0,
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {done ? '\u2713' : ''}
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: done ? '#6d7175' : '#202223',
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {step.label}
                </div>
                <div style={{ fontSize: '12px', color: '#6d7175' }}>
                  {step.description}
                </div>
              </div>

              <button
                onClick={() => window.open(step.deepLink, '_blank')}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: done ? '#e4e5e7' : '#008060',
                  color: done ? '#6d7175' : '#ffffff',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {done ? 'Open Editor' : 'Enable in Theme'}
              </button>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div
          style={{
            marginTop: '10px',
            fontSize: '13px',
            color: '#1a5632',
            fontWeight: 500,
          }}
        >
          All widgets enabled! Your bundles are ready to display on your storefront.
        </div>
      )}
    </div>
  );
}

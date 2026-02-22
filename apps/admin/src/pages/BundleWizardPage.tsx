import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBundlesStore } from '../stores/bundles.store';
import { useProductsStore } from '../stores/products.store';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';
import { BundleWizard } from '../components/bundles/BundleWizard';
import { LoadingState } from '../components/common/LoadingState';
import type { CreateBundleDto } from '@bundlify/shared-types';

export function BundleWizardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fetch = useAuthenticatedFetch();
  const {
    currentBundle,
    loading,
    fetchBundle,
    createBundle,
    updateBundle,
    clearCurrentBundle,
  } = useBundlesStore();
  const { products, fetchProducts } = useProductsStore();

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts(fetch);
    }
    if (id) {
      fetchBundle(fetch, id);
    }
    return () => {
      clearCurrentBundle();
    };
  }, [id]);

  const handleSubmit = async (data: CreateBundleDto) => {
    if (id && currentBundle) {
      await updateBundle(fetch, id, data);
    } else {
      await createBundle(fetch, data);
    }
    navigate('/bundles');
  };

  const handleCancel = () => {
    navigate('/bundles');
  };

  if (id && loading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        <LoadingState />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Link
          to="/bundles"
          style={{
            fontSize: '14px',
            color: '#008060',
            textDecoration: 'none',
          }}
        >
          &larr; Back to Bundles
        </Link>
      </div>
      <h1 style={{ fontSize: '24px', margin: '0 0 20px 0' }}>
        {id ? 'Edit Bundle' : 'Create Bundle'}
      </h1>
      <BundleWizard
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        products={products}
        editBundle={id ? currentBundle : undefined}
        fetch={fetch}
      />
    </div>
  );
}

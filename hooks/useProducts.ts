'use client';

import { useState, useCallback, useEffect } from 'react';
import { Product } from '@/lib/db';
import { ProductFormData } from '@/components/ProductModal';
import { useToast } from './useToast';

interface ProductsData {
  physical: Product[];
  dropship: Product[];
}

async function parseApi<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Request failed');
  return json.data as T;
}

export function useProducts() {
  const { showToast } = useToast();
  const [physical, setPhysical] = useState<Product[]>([]);
  const [dropship, setDropship] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await parseApi<ProductsData>(res);
      setPhysical(data.physical);
      setDropship(data.dropship);
    } catch {
      showToast('✗ Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const allProducts = [...physical, ...dropship];

  const createProduct = useCallback(
    async (data: ProductFormData) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        showToast('✗ Error saving', 'error');
        throw new Error('Failed');
      }
      await fetchProducts();
      showToast('✓ Product added', 'success');
    },
    [fetchProducts, showToast]
  );

  const updateProduct = useCallback(
    async (data: ProductFormData) => {
      if (!data.id) return;
      const res = await fetch(`/api/products/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        showToast('✗ Error saving', 'error');
        throw new Error('Failed');
      }
      await fetchProducts();
      showToast('✓ Saved', 'success');
    },
    [fetchProducts, showToast]
  );

  const updateStatus = useCallback(
    async (id: number, status: string) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        showToast('✗ Error saving', 'error');
        return;
      }
      const updated = await parseApi<Product>(res);
      const updateList = (list: Product[]) =>
        list.map((p) => (p.id === id ? updated : p));
      setPhysical(updateList);
      setDropship(updateList);
      showToast('✓ Saved', 'success');
    },
    [showToast]
  );

  const deleteProduct = useCallback(
    async (id: number) => {
      setDeletingIds((prev) => new Set(prev).add(id));
      await new Promise((r) => setTimeout(r, 300));
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (!res.ok) {
        showToast('✗ Error deleting', 'error');
        return;
      }
      setPhysical((p) => p.filter((x) => x.id !== id));
      setDropship((d) => d.filter((x) => x.id !== id));
      showToast('✓ Product deleted', 'success');
    },
    [showToast]
  );

  return {
    physical,
    dropship,
    allProducts,
    loading,
    deletingIds,
    fetchProducts,
    createProduct,
    updateProduct,
    updateStatus,
    deleteProduct,
  };
}

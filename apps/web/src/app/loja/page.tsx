import type { Metadata } from 'next';
import { StorePage } from '@/components/app/StorePage';

export const metadata: Metadata = {
  title: 'Loja — Age of AI',
  description: 'Loja Age of AI'
};

export default function AppStoreRoute() {
  return <StorePage />;
}

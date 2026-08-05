import type { Metadata } from 'next';
import { MenuLobby } from '@/components/app/MenuLobby';

export const metadata: Metadata = {
  title: 'Menu — Age of AI',
  description: 'Lobby do Age of AI'
};

export default function AppMenuPage() {
  return <MenuLobby />;
}

import type { Metadata } from 'next';
import { GameClientIsland } from '@/components/app/GameClientIsland';

export const metadata: Metadata = {
  title: 'Jogo — Age of AI',
  description: 'Mundo Age of AI'
};

export default function AppGamePage() {
  return <GameClientIsland />;
}

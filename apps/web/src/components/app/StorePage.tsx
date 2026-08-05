'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RequireAuth } from '@/components/app/RequireAuth';
import { APP_MENU_PATH } from '@/lib/app-paths';
import '@/components/app/app-shell.css';

const ITEMS = [
  { id: 1, name: 'Espada', price: 100 },
  { id: 2, name: 'Escudo', price: 150 },
  { id: 3, name: 'Poção de Vida', price: 50 }
];

export function StorePage() {
  return (
    <RequireAuth>
      <StoreInner />
    </RequireAuth>
  );
}

function StoreInner() {
  const [msg, setMsg] = useState('');

  function buy(name: string, price: number) {
    setMsg(`Compraste ${name} por ${price} ouro (stub).`);
  }

  return (
    <div className="app-page">
      <div className="app-bg" aria-hidden="true" />
      <div className="app-screen">
        <div className="app-shell" style={{ maxWidth: 560 }}>
          <header className="app-header">
            <Link href="/" className="app-brand">
              Age of AI
            </Link>
            <Link href={APP_MENU_PATH} className="app-chip" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              Menu
            </Link>
          </header>

          <div className="app-hero">
            <h1>Loja</h1>
            <p>Itens e personalizações (em desenvolvimento).</p>
          </div>

          <div className="app-store-list">
            {ITEMS.map((item) => (
              <div key={item.id} className="app-store-item">
                <span>
                  {item.name} — {item.price} ouro
                </span>
                <button type="button" className="app-primary" onClick={() => buy(item.name, item.price)}>
                  Comprar
                </button>
              </div>
            ))}
          </div>

          {msg && <p className="app-ok">{msg}</p>}

          <div className="app-actions">
            <Link href={APP_MENU_PATH} className="app-secondary">
              Voltar ao menu
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

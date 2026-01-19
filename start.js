#!/usr/bin/env node

console.log('🚀 Iniciando Age of AI Server...\n');

// Verificar se as dependências estão instaladas
try {
  require('express');
  require('ws');
  console.log('✅ Dependências básicas verificadas');
} catch (error) {
  console.error('❌ Erro: Dependências não instaladas');
  console.error('Execute: npm install ou pnpm install');
  process.exit(1);
}

// Configurar variáveis de ambiente
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Importar o servidor
try {
  require('./server/server.js');
} catch (error) {
  console.error('❌ Erro ao iniciar o servidor:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}

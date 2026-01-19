const mongoose = require('mongoose');
const config = require('./config');

// Função para conectar ao MongoDB
async function connectToDatabase() {
  try {
    // Verificar se o MongoDB está disponível
    if (!config.database.host || config.database.host === 'localhost') {
      console.log('⚠️  MongoDB não configurado, rodando sem persistência');
      return true; // Continuar sem banco de dados
    }
    
    const connectionString = `mongodb://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}?authSource=admin`;
    
    await mongoose.connect(connectionString);
    
    console.log('✅ Conectado ao MongoDB com sucesso!');
    return true;
  } catch (error) {
    console.warn('⚠️  Erro ao conectar ao MongoDB:', error.message);
    console.log('⚠️  Continuando sem persistência de dados');
    return true; // Continuar sem banco de dados
  }
}

module.exports = {
  connectToDatabase
}; 
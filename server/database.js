const mongoose = require('mongoose');
const config = require('./config');

// Função para conectar ao MongoDB
async function connectToDatabase() {
  try {
    const connectionString = `mongodb://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}?authSource=admin`;
    
    await mongoose.connect(connectionString);
    
    console.log('Conectado ao MongoDB com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    return false;
  }
}

module.exports = {
  connectToDatabase
}; 
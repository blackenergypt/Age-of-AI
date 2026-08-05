const mongoose = require('mongoose');
const config = require('./config');

let connected = false;

async function connectToDatabase() {
  const { host, port, name, user, password } = config.database;

  if (!host) {
    console.log('⚠️  MongoDB host em falta — a correr sem persistência');
    return false;
  }

  const connectionString = user
    ? `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}?authSource=admin`
    : `mongodb://${host}:${port}/${name}`;

  try {
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000
    });
    connected = true;
    console.log(`✅ Conectado ao MongoDB (${host}:${port}/${name})`);
    return true;
  } catch (error) {
    connected = false;
    console.warn('⚠️  Erro ao conectar ao MongoDB:', error.message);
    console.log('⚠️  Continuando sem persistência de dados');
    return false;
  }
}

function isDatabaseConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectToDatabase,
  isDatabaseConnected
};

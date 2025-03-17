const { v4: uuidv4 } = require('uuid');

class Kingdom {
  constructor(name, leaderId) {
    this.id = uuidv4();
    this.name = name;
    this.leaderId = leaderId;
    this.members = new Map();
    this.color = this.generateRandomColor();
    this.createdAt = Date.now();
  }
  
  generateRandomColor() {
    const colors = [
      '#FF0000', // Vermelho
      '#0000FF', // Azul
      '#00FF00', // Verde
      '#FFFF00', // Amarelo
      '#FF00FF', // Magenta
      '#00FFFF', // Ciano
      '#FFA500', // Laranja
      '#800080'  // Roxo
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  addMember(playerId, playerName) {
    this.members.set(playerId, {
      id: playerId,
      name: playerName,
      joinedAt: Date.now()
    });
  }
  
  removeMember(playerId) {
    this.members.delete(playerId);
    
    // Se o líder saiu, escolher um novo líder
    if (playerId === this.leaderId && this.members.size > 0) {
      this.leaderId = Array.from(this.members.keys())[0];
    }
    
    return this.members.size;
  }
  
  getInfo() {
    return {
      id: this.id,
      name: this.name,
      leaderId: this.leaderId,
      color: this.color,
      memberCount: this.members.size,
      members: Array.from(this.members.values())
    };
  }
}

module.exports = Kingdom; 
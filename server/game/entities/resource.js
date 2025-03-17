class Resource {
  constructor(id, x, y, type, amount, harvestRate) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.amount = amount;
    this.harvestRate = harvestRate;
    this.entityType = 'resource';
  }
  
  harvest(amount) {
    const harvestedAmount = Math.min(amount, this.amount);
    this.amount -= harvestedAmount;
    return harvestedAmount;
  }
  
  isDepletable() {
    return this.amount <= 0;
  }
  
  getInfo() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.type,
      amount: this.amount,
      entityType: this.entityType
    };
  }
}

module.exports = Resource; 
const OrderStatus = require('./OrderStatus');
const OrderItem   = require('./OrderItem');

class Order {
  constructor({ id, userId, status, total, items = [], createdAt }) {
    this.id        = id;
    this.userId    = userId;
    this.status    = new OrderStatus(status || 'pending');
    this.total     = parseFloat(total || 0);
    this.items     = items.map(i => i instanceof OrderItem ? i : new OrderItem(i));
    this.createdAt = createdAt;
  }

  calculateTotal() {
    this.total = this.items.reduce((sum, item) => sum + item.subtotal, 0);
    return this;
  }

  updateStatus(newStatus) {
    this.status = this.status.transitionTo(newStatus);
    return this;
  }

  toJSON() {
    return {
      id:        this.id,
      userId:    this.userId,
      status:    this.status.toString(),
      total:     this.total,
      items:     this.items.map(i => i.toJSON()),
      createdAt: this.createdAt,
    };
  }
}

module.exports = Order;
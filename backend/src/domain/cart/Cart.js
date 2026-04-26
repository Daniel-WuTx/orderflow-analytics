class Cart {
  constructor({ userId, items = [], updatedAt }) {
    this.userId    = userId;
    this.items     = items;
    this.updatedAt = updatedAt || new Date();
  }

  addItem({ productId, quantity, unitPrice, name }) {
    const existing = this.items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ productId, quantity, unitPrice, name });
    }
    this.updatedAt = new Date();
    return this;
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.productId !== productId);
    this.updatedAt = new Date();
    return this;
  }

  updateQuantity(productId, quantity) {
    if (quantity <= 0) return this.removeItem(productId);
    const item = this.items.find(i => i.productId === productId);
    if (item) item.quantity = quantity;
    this.updatedAt = new Date();
    return this;
  }

  get total() {
    return this.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  }

  get isEmpty() {
    return this.items.length === 0;
  }

  clear() {
    this.items = [];
    this.updatedAt = new Date();
    return this;
  }

  toJSON() {
    return {
      userId:    this.userId,
      items:     this.items,
      total:     this.total,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Cart;
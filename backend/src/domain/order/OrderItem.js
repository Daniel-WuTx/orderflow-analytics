class OrderItem {
  constructor({ id, orderId, productId, quantity, unitPrice }) {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a 0');
    if (unitPrice < 0) throw new Error('El precio no puede ser negativo');

    this.id        = id;
    this.orderId   = orderId;
    this.productId = productId;
    this.quantity  = parseInt(quantity);
    this.unitPrice = parseFloat(unitPrice);
  }

  get subtotal() {
    return this.quantity * this.unitPrice;
  }

  toJSON() {
    return {
      id:        this.id,
      orderId:   this.orderId,
      productId: this.productId,
      quantity:  this.quantity,
      unitPrice: this.unitPrice,
      subtotal:  this.subtotal,
    };
  }
}

module.exports = OrderItem;
const VALID = ['pending','processing','shipped','delivered','cancelled'];

class OrderStatus {
  constructor(value) {
    if (!VALID.includes(value))
      throw new Error(`Estado inválido: ${value}`);
    this.value = value;
  }

  isPending()    { return this.value === 'pending'; }
  isCancelled()  { return this.value === 'cancelled'; }

  canTransitionTo(next) {
    const transitions = {
      pending:    ['processing','cancelled'],
      processing: ['shipped','cancelled'],
      shipped:    ['delivered'],
      delivered:  [],
      cancelled:  [],
    };
    return transitions[this.value].includes(next);
  }

  transitionTo(next) {
    if (!this.canTransitionTo(next))
      throw new Error(`No se puede pasar de "${this.value}" a "${next}"`);
    return new OrderStatus(next);
  }

  toString() { return this.value; }
}

module.exports = OrderStatus;
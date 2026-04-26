class Payment {
  constructor({ id, userId, orderId, idempotencyKey, amount, currency, status, provider, providerId, metadata, createdAt }) {
    this.id             = id;
    this.userId         = userId;
    this.orderId        = orderId;
    this.idempotencyKey = idempotencyKey;
    this.amount         = parseFloat(amount);
    this.currency       = currency || 'COP';
    this.status         = status  || 'pending';
    this.provider       = provider || 'wompi';
    this.providerId     = providerId;
    this.metadata       = metadata || {};
    this.createdAt      = createdAt;
  }

  isApproved()  { return this.status === 'approved';  }
  isPending()   { return this.status === 'pending';   }
  isFailed()    { return this.status === 'failed' || this.status === 'declined'; }

  toJSON() {
    return {
      id:             this.id,
      userId:         this.userId,
      orderId:        this.orderId,
      idempotencyKey: this.idempotencyKey,
      amount:         this.amount,
      currency:       this.currency,
      status:         this.status,
      provider:       this.provider,
      providerId:     this.providerId,
      metadata:       this.metadata,
      createdAt:      this.createdAt,
    };
  }
}

module.exports = Payment;
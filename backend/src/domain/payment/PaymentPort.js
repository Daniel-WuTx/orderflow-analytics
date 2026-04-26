class PaymentPort {
  /**
   * Crea un intento de pago
   * @param {{ amount, currency, orderId, idempotencyKey, metadata }} params
   * @returns {{ paymentId, status, redirectUrl }}
   */
  async createPayment(params)   { throw new Error('Not implemented'); }

  /**
   * Verifica el estado de un pago
   * @param {string} paymentId
   * @returns {{ paymentId, status, amount }}
   */
  async getPaymentStatus(paymentId) { throw new Error('Not implemented'); }
}

module.exports = PaymentPort;
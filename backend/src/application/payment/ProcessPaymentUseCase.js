const Payment = require('../../domain/payment/Payment');

class ProcessPaymentUseCase {
  constructor({ paymentRepository, orderRepository, paymentPort }) {
    this.paymentRepository = paymentRepository;
    this.orderRepository   = orderRepository;
    this.paymentPort       = paymentPort;
  }

  async execute({ userId, orderId, idempotencyKey, currency = 'COP' }) {
    if (!idempotencyKey)
      throw new Error('idempotency_key es requerido');

    // IDEMPOTENCIA: si ya existe un pago con esta key, lo devuelve sin crear otro
    const existing = await this.paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      console.log(`Pago duplicado detectado — key: ${idempotencyKey}`);
      return existing;
    }

    // Verifica que la orden existe y pertenece al usuario
    const order = await this.orderRepository.findById(orderId);
    if (!order)             throw new Error('Orden no encontrada');
    if (order.userId !== userId) throw new Error('No autorizado');

    // Crea el intento de pago en la BD antes de llamar al proveedor
    const payment = new Payment({
      userId,
      orderId,
      idempotencyKey,
      amount:   order.total,
      currency,
      status:   'pending',
      provider: 'wompi',
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Llama al adaptador de pagos — si cambia el proveedor, solo cambia el adaptador
    const result = await this.paymentPort.createPayment({
      amount:         order.total,
      currency,
      orderId,
      idempotencyKey,
      metadata: { userId },
    });

    // Actualiza el estado con el ID del proveedor
    const updated = await this.paymentRepository.updateStatus(
      savedPayment.id,
      result.status,
      result.paymentId
    );

    return { payment: updated, redirectUrl: result.redirectUrl };
  }
}

module.exports = ProcessPaymentUseCase;
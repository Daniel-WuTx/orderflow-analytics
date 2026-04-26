const container = require('../../container');

const processPayment = async (req, res) => {
  try {
    const { order_id, idempotency_key, currency } = req.body;

    if (!order_id || !idempotency_key)
      return res.status(400).json({ error: 'order_id e idempotency_key son requeridos' });

    const result = await container.processPaymentUseCase.execute({
      userId:         req.user.id,
      orderId:        order_id,
      idempotencyKey: idempotency_key,
      currency,
    });

    res.status(201).json(result);
  } catch (err) {
    const code = err.message === 'Orden no encontrada' ? 404
               : err.message === 'No autorizado'       ? 403
               : 400;
    res.status(code).json({ error: err.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const payment = await container.getPaymentStatusUseCase.execute(req.params.orderId);
    res.json(payment.toJSON());
  } catch (err) {
    const code = err.message.includes('No hay pagos') ? 404 : 500;
    res.status(code).json({ error: err.message });
  }
};

// Webhook de Wompi — Wompi llama a este endpoint cuando cambia el estado del pago
const webhook = async (req, res) => {
  try {
    const { event, data } = req.body;
    if (event === 'transaction.updated') {
      const { id, status, reference } = data.transaction;
      const payments = await container.paymentRepository.findByOrderId(reference);
      if (payments.length) {
        await container.paymentRepository.updateStatus(
          payments[0].id,
          status.toLowerCase(),
          id
        );
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { processPayment, getPaymentStatus, webhook };
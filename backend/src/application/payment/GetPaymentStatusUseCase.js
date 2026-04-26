class GetPaymentStatusUseCase {
  constructor({ paymentRepository, paymentPort }) {
    this.paymentRepository = paymentRepository;
    this.paymentPort       = paymentPort;
  }

  async execute(orderId) {
    const payments = await this.paymentRepository.findByOrderId(orderId);
    if (!payments.length) throw new Error('No hay pagos para esta orden');

    const latest = payments[0];

    // Si ya está aprobado o fallido no consultamos al proveedor
    if (latest.isApproved() || latest.isFailed()) return latest;

    // Consulta estado actual en el proveedor
    const result = await this.paymentPort.getPaymentStatus(latest.providerId);
    if (result.status !== latest.status) {
      return this.paymentRepository.updateStatus(latest.id, result.status);
    }

    return latest;
  }
}

module.exports = GetPaymentStatusUseCase;
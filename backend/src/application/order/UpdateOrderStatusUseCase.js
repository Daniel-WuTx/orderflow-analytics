class UpdateOrderStatusUseCase {
  constructor({ orderRepository }) {
    this.orderRepository = orderRepository;
  }

  async execute(orderId, newStatus) {
    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new Error('Orden no encontrada');

    // La entidad valida la transición de estado
    order.updateStatus(newStatus);

    return this.orderRepository.updateStatus(orderId, order.status.toString());
  }
}

module.exports = UpdateOrderStatusUseCase;
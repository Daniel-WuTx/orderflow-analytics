const Order     = require('../../domain/order/Order');
const OrderItem = require('../../domain/order/OrderItem');

class CreateOrderUseCase {
  constructor({ orderRepository, productRepository }) {
    this.orderRepository   = orderRepository;
    this.productRepository = productRepository;
  }

  async execute({ userId, items }) {
    if (!items || items.length === 0)
      throw new Error('El carrito está vacío');

    // Verifica stock y construye los items con precio real
    const orderItems = [];
    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) throw new Error(`Producto ${item.productId} no encontrado`);

      // La entidad valida el stock — lógica de negocio en el dominio
      product.decreaseStock(item.quantity);

      orderItems.push(new OrderItem({
        productId:  item.productId,
        quantity:   item.quantity,
        unitPrice:  product.price,
      }));
    }

    const order = new Order({ userId, status: 'pending', items: orderItems });
    order.calculateTotal();

    return this.orderRepository.save(order);
  }
}

module.exports = CreateOrderUseCase;
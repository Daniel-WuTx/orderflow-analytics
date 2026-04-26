const Order     = require('../../domain/order/Order');
const OrderItem = require('../../domain/order/OrderItem');

class CheckoutUseCase {
  constructor({ cartRepository, orderRepository, productRepository }) {
    this.cartRepository    = cartRepository;
    this.orderRepository   = orderRepository;
    this.productRepository = productRepository;
  }

  async execute({ userId }) {
    // 1. Obtiene el carrito desde Redis
    const cart = await this.cartRepository.findByUserId(userId);
    if (cart.isEmpty) throw new Error('El carrito está vacío');

    // 2. Valida stock de cada item antes de tocar la BD
    const orderItems = [];
    for (const item of cart.items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product)
        throw new Error(`Producto "${item.name}" ya no está disponible`);
      if (!product.hasStock(item.quantity))
        throw new Error(`Stock insuficiente para "${item.name}". Disponible: ${product.stock}`);

      orderItems.push(new OrderItem({
        productId:  item.productId,
        quantity:   item.quantity,
        unitPrice:  product.price,
      }));
    }

    // 3. Crea la orden con transacción ACID — si falla algo hace rollback
    const order = new Order({ userId, status: 'pending', items: orderItems });
    order.calculateTotal();

    const savedOrder = await this.orderRepository.save(order);

    // 4. Solo limpia el carrito si la orden se guardó exitosamente
    await this.cartRepository.delete(userId);

    return savedOrder;
  }
}

module.exports = CheckoutUseCase;
class AddToCartUseCase {
  constructor({ cartRepository, productRepository }) {
    this.cartRepository   = cartRepository;
    this.productRepository = productRepository;
  }

  async execute({ userId, productId, quantity }) {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a 0');

    const product = await this.productRepository.findById(productId);
    if (!product)              throw new Error('Producto no encontrado');
    if (!product.hasStock(quantity)) throw new Error('Stock insuficiente');

    const cart = await this.cartRepository.findByUserId(userId);
    cart.addItem({
      productId,
      quantity,
      unitPrice: product.price,
      name:      product.name,
    });

    await this.cartRepository.save(cart);
    return cart;
  }
}

module.exports = AddToCartUseCase;
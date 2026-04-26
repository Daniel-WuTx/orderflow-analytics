class UpdateCartItemUseCase {
  constructor({ cartRepository }) {
    this.cartRepository = cartRepository;
  }

  async execute({ userId, productId, quantity }) {
    const cart = await this.cartRepository.findByUserId(userId);
    cart.updateQuantity(productId, quantity);
    await this.cartRepository.save(cart);
    return cart;
  }
}

module.exports = UpdateCartItemUseCase;
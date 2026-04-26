class RemoveFromCartUseCase {
  constructor({ cartRepository }) {
    this.cartRepository = cartRepository;
  }

  async execute({ userId, productId }) {
    const cart = await this.cartRepository.findByUserId(userId);
    cart.removeItem(productId);
    await this.cartRepository.save(cart);
    return cart;
  }
}

module.exports = RemoveFromCartUseCase;
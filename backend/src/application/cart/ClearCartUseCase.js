class ClearCartUseCase {
  constructor({ cartRepository }) {
    this.cartRepository = cartRepository;
  }

  async execute(userId) {
    await this.cartRepository.delete(userId);
  }
}

module.exports = ClearCartUseCase;
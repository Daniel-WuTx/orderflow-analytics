class GetCartUseCase {
  constructor({ cartRepository }) {
    this.cartRepository = cartRepository;
  }

  async execute(userId) {
    return this.cartRepository.findByUserId(userId);
  }
}

module.exports = GetCartUseCase;
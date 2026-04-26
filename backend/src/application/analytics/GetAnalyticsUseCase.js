class GetAnalyticsUseCase {
  constructor({ analyticsRepository }) {
    this.repo = analyticsRepository;
  }

  async getSummary() {
    return this.repo.getSummary();
  }

  async getSalesByMonth() {
    return this.repo.getSalesByMonth();
  }

  async getTopProducts(limit = 10) {
    return this.repo.getTopProducts(limit);
  }

  async getCustomerBehavior(limit = 20) {
    return this.repo.getCustomerBehavior(limit);
  }

  async getProductTrend(productId) {
    if (!productId) throw new Error('productId es requerido');
    return this.repo.getProductTrend(productId);
  }

  async getUserProfile(userId) {
    return this.repo.getUserProfile(userId);
  }

  async getRFM() {
    return this.repo.getRFM();
  }

  async refreshViews() {
    return this.repo.refreshViews();
  }
}

module.exports = GetAnalyticsUseCase;
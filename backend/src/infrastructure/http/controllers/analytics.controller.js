class AnalyticsController {
  constructor({ getAnalyticsUseCase }) {
    this.useCase = getAnalyticsUseCase;

    this.getSummary         = this.getSummary.bind(this);
    this.getSalesByMonth    = this.getSalesByMonth.bind(this);
    this.getTopProducts     = this.getTopProducts.bind(this);
    this.getCustomerBehavior = this.getCustomerBehavior.bind(this);
    this.getProductTrend    = this.getProductTrend.bind(this);
    this.getRFM             = this.getRFM.bind(this);
    this.refreshViews       = this.refreshViews.bind(this);
    this.getUserProfile = this.getUserProfile.bind(this);
  }

  async getSummary(req, res) {
    try {
      const data = await this.useCase.getSummary();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async getSalesByMonth(req, res) {
    try {
      const data = await this.useCase.getSalesByMonth();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async getTopProducts(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data  = await this.useCase.getTopProducts(limit);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async getCustomerBehavior(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const data  = await this.useCase.getCustomerBehavior(limit);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async getProductTrend(req, res) {
    try {
      const { productId } = req.params;
      const data = await this.useCase.getProductTrend(productId);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  }

  async getRFM(req, res) {
    try {
      const data = await this.useCase.getRFM();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async getUserProfile(req, res) {
    try {
      const data = await this.useCase.getUserProfile(req.user.id);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }

  async refreshViews(req, res) {
    try {
      await this.useCase.refreshViews();
      res.json({ ok: true, message: 'Vistas materializadas actualizadas' });
    } catch (err) {
      res.status(500).json({ ok: false, error: err.message });
    }
  }
}

module.exports = AnalyticsController;
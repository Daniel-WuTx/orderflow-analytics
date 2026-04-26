const container = require('../../container');

const create = async (req, res) => {
  try {
    const order = await container.createOrderUseCase.execute({
      userId: req.user.id,
      items:  req.body.items.map(i => ({
        productId: i.product_id,
        quantity:  i.quantity,
      })),
    });
    res.status(201).json(order.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await container.getMyOrdersUseCase.execute(req.user.id);
    res.json(orders.map(o => o.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const order = await container.updateOrderStatusUseCase.execute(
      req.params.id, req.body.status
    );
    res.json(order.toJSON());
  } catch (err) {
    const code = err.message === 'Orden no encontrada' ? 404 : 400;
    res.status(code).json({ error: err.message });
  }
};

module.exports = { create, getMyOrders, updateStatus };
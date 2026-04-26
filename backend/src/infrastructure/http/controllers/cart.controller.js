const container = require('../../container');

const getCart = async (req, res) => {
  try {
    const cart = await container.getCartUseCase.execute(req.user.id);
    res.json(cart.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addItem = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;  // desestructura primero
    
    if (!product_id || !quantity)
      return res.status(400).json({ error: 'product_id y quantity son requeridos' });

    const cart = await container.addToCartUseCase.execute({
      userId:    req.user.id,
      productId: product_id,
      quantity:  parseInt(quantity),
    });
    res.json(cart.toJSON());
  } catch (err) {
    const code = err.message.includes('no encontrado') ? 404 : 400;
    res.status(code).json({ error: err.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const cart = await container.updateCartItemUseCase.execute({
      userId:    req.user.id,
      productId: req.params.productId,
      quantity:  req.body.quantity,
    });
    res.json(cart.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const cart = await container.removeFromCartUseCase.execute({
      userId:    req.user.id,
      productId: req.params.productId,
    });
    res.json(cart.toJSON());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const checkout = async (req, res) => {
  try {
    const order = await container.checkoutUseCase.execute({ userId: req.user.id });
    res.status(201).json(order.toJSON());
  } catch (err) {
    const code = err.message === 'El carrito está vacío' ? 400 : 409;
    res.status(code).json({ error: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await container.clearCartUseCase.execute(req.user.id);
    res.json({ message: 'Carrito vaciado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getCart, addItem, updateItem, removeItem, checkout, clearCart };
// Repositories
const PostgresProductRepository = require('./db/repositories/PostgresProductRepository');
const PostgresOrderRepository   = require('./db/repositories/PostgresOrderRepository');
const PostgresUserRepository    = require('./db/repositories/PostgresUserRepository');
const PostgresPaymentRepository = require('./db/repositories/PostgresPaymentRepository');

// Cache
const RedisCartRepository = require('./cache/RedisCartRepository');

// Payment Adapter
const WompiAdapter = require('./payment/WompiAdapter');

// Product Use Cases
const GetProductsUseCase    = require('../application/product/GetProductsUseCase');
const GetProductByIdUseCase = require('../application/product/GetProductByIdUseCase');
const CreateProductUseCase  = require('../application/product/CreateProductUseCase');
const UpdateProductUseCase  = require('../application/product/UpdateProductUseCase');
const DeleteProductUseCase  = require('../application/product/DeleteProductUseCase');

// Order Use Cases
const CreateOrderUseCase       = require('../application/order/CreateOrderUseCase');
const GetMyOrdersUseCase       = require('../application/order/GetMyOrdersUseCase');
const UpdateOrderStatusUseCase = require('../application/order/UpdateOrderStatusUseCase');

// User Use Cases
const RegisterUseCase   = require('../application/user/RegisterUseCase');
const LoginUseCase      = require('../application/user/LoginUseCase');
const UpdateRoleUseCase = require('../application/user/UpdateRoleUseCase');

// Cart Use Cases
const GetCartUseCase        = require('../application/cart/GetCartUseCase');
const AddToCartUseCase      = require('../application/cart/AddToCartUseCase');
const UpdateCartItemUseCase = require('../application/cart/UpdateCartItemUseCase');
const RemoveFromCartUseCase = require('../application/cart/RemoveFromCartUseCase');
const ClearCartUseCase      = require('../application/cart/ClearCartUseCase');
const CheckoutUseCase       = require('../application/cart/CheckoutUseCase');

// Payment Use Cases
const ProcessPaymentUseCase   = require('../application/payment/ProcessPaymentUseCase');
const GetPaymentStatusUseCase = require('../application/payment/GetPaymentStatusUseCase');


// ==========================
// 🔧 INSTANCIAS (Infraestructura)
// ==========================

const productRepository = new PostgresProductRepository();
const orderRepository   = new PostgresOrderRepository();
const userRepository    = new PostgresUserRepository();
const paymentRepository = new PostgresPaymentRepository();

const cartRepository = new RedisCartRepository();
const paymentPort    = new WompiAdapter();


// ==========================
// 🚀 EXPORTS (DI Container)
// ==========================

module.exports = {
  // ======================
  // PRODUCTS
  // ======================
  getProductsUseCase:     new GetProductsUseCase({ productRepository }),
  getProductByIdUseCase:  new GetProductByIdUseCase({ productRepository }),
  createProductUseCase:   new CreateProductUseCase({ productRepository }),
  updateProductUseCase:   new UpdateProductUseCase({ productRepository }),
  deleteProductUseCase:   new DeleteProductUseCase({ productRepository }),

  // ======================
  // ORDERS
  // ======================
  createOrderUseCase:       new CreateOrderUseCase({ orderRepository, productRepository }),
  getMyOrdersUseCase:       new GetMyOrdersUseCase({ orderRepository }),
  updateOrderStatusUseCase: new UpdateOrderStatusUseCase({ orderRepository }),

  // ======================
  // USERS
  // ======================
  registerUseCase:    new RegisterUseCase({ userRepository }),
  loginUseCase:       new LoginUseCase({ userRepository }),
  updateRoleUseCase:  new UpdateRoleUseCase({ userRepository }),

  // ======================
  // CART
  // ======================
  cartRepository,

  getCartUseCase:        new GetCartUseCase({ cartRepository }),
  addToCartUseCase:      new AddToCartUseCase({ cartRepository, productRepository }),
  updateCartItemUseCase: new UpdateCartItemUseCase({ cartRepository }),
  removeFromCartUseCase: new RemoveFromCartUseCase({ cartRepository }),
  clearCartUseCase:      new ClearCartUseCase({ cartRepository }),
  checkoutUseCase:       new CheckoutUseCase({ cartRepository, orderRepository, productRepository }),

  // ======================
  // PAYMENT
  // ======================
  paymentRepository,
  processPaymentUseCase:   new ProcessPaymentUseCase({
    paymentRepository,
    orderRepository,
    paymentPort
  }),
  getPaymentStatusUseCase: new GetPaymentStatusUseCase({
    paymentRepository,
    paymentPort
  }),

  // ======================
  // REPOSITORIES (opcional)
  // ======================
  userRepository,
  productRepository,
};
const Redis          = require('ioredis');
const CartRepository = require('../../domain/cart/CartRepository');
const Cart           = require('../../domain/cart/Cart');

const CART_TTL = 60 * 60 * 24 * 7; // 7 días en segundos

class RedisCartRepository extends CartRepository {
  constructor() {
    super();
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    });

    this.client.on('connect', () => console.log('Redis connected'));
    this.client.on('error',   (err) => console.error('Redis error:', err));
  }

  _key(userId) { return `cart:${userId}`; }

  async findByUserId(userId) {
    const data = await this.client.get(this._key(userId));
    if (!data) return new Cart({ userId, items: [] });
    return new Cart(JSON.parse(data));
  }

  async save(cart) {
    await this.client.setex(
      this._key(cart.userId),
      CART_TTL,
      JSON.stringify(cart.toJSON())
    );
    return cart;
  }

  async delete(userId) {
    await this.client.del(this._key(userId));
  }
}

module.exports = RedisCartRepository;
class Product {
  constructor({ id, categoryId, category_id, name, description, price, stock, createdAt, created_at, categoryName, category_name }) {
    this.id           = id;
    this.categoryId   = categoryId || category_id;
    this.categoryName = categoryName || category_name;
    this.name         = name;
    this.description  = description;
    this.price        = parseFloat(price);
    this.stock        = parseInt(stock);
    this.createdAt    = createdAt || created_at;
  }

  hasStock(quantity) {
    return this.stock >= quantity;
  }

  decreaseStock(quantity) {
    if (!this.hasStock(quantity))
      throw new Error(`Stock insuficiente para "${this.name}"`);
    this.stock -= quantity;
    return this;
  }

  toJSON() {
    return {
      id:           this.id,
      categoryId:   this.categoryId,
      category_id:  this.categoryId,
      categoryName: this.categoryName,
      category_name:this.categoryName,
      name:         this.name,
      description:  this.description,
      price:        this.price,
      stock:        this.stock,
      createdAt:    this.createdAt,
    };
  }
}

module.exports = Product;
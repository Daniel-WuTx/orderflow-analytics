const container = require('../../container');

const getAll = async (req, res) => {
  try {
    const result = await container.getProductsUseCase.execute(req.query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const product = await container.getProductByIdUseCase.execute(req.params.id);
    res.json(product);
  } catch (err) {
    const code = err.message === 'Producto no encontrado' ? 404 : 500;
    res.status(code).json({ error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    const product = await container.createProductUseCase.execute({
      name, description, price, stock, categoryId: category_id
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { name, description, price, stock, category_id } = req.body;
    const product = await container.updateProductUseCase.execute(req.params.id, {
      name, description, price, stock, categoryId: category_id
    });
    res.json(product);
  } catch (err) {
    const code = err.message === 'Producto no encontrado' ? 404 : 400;
    res.status(code).json({ error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await container.deleteProductUseCase.execute(req.params.id);
    res.json(result);
  } catch (err) {
    const code = err.message === 'Producto no encontrado' ? 404 : 500;
    res.status(code).json({ error: err.message });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await container.productRepository.findCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
    const slug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { rows } = await require('../../db/pool').query(
      `INSERT INTO categories (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO NOTHING RETURNING *`,
      [name.trim(), slug]
    );
    if (!rows[0]) return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const pool = require('../../db/pool');
const path = require('path');
const fs   = require('fs');

const getImages = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM product_images WHERE product_id = $1 ORDER BY position`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addImage = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' });
  try {
    const { rows: current } = await pool.query(
      'SELECT COUNT(*) FROM product_images WHERE product_id = $1',
      [req.params.id]
    );
    if (parseInt(current[0].count) >= 6)
      return res.status(400).json({ error: 'Máximo 6 imágenes por producto' });

    const url      = `/uploads/${req.file.filename}`;
    const position = parseInt(current[0].count);
    const { rows } = await pool.query(
      `INSERT INTO product_images (product_id, url, position) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, url, position]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'DELETE FROM product_images WHERE id = $1 AND product_id = $2 RETURNING *',
      [req.params.imageId, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Imagen no encontrada' });

    const filePath = path.join(__dirname, '../../../uploads', path.basename(rows[0].url));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAll, getOne, create, update, remove, getCategories, createCategory, getImages, addImage, deleteImage };
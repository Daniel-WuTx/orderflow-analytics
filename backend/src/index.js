const express  = require('express');
const cors     = require('cors');
const path     = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas nuevas — arquitectura hexagonal
app.use('/api/auth',      require('./infrastructure/http/routes/auth.routes'));
app.use('/api/products',  require('./infrastructure/http/routes/products.routes'));
app.use('/api/orders',    require('./infrastructure/http/routes/orders.routes'));
app.use('/api/users',     require('./infrastructure/http/routes/users.routes'));
app.use('/api/analytics', require('./infrastructure/http/routes/analytics.routes'));
app.use('/api/cart', require('./infrastructure/http/routes/cart.routes'));
app.use('/api/payments', require('./infrastructure/http/routes/payment.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', architecture: 'hexagonal' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} — Hexagonal Architecture`));
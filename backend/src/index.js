const ordersRoutes = require('./routes/orders.routes');
const productsRoutes = require('./routes/products.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/analytics', analyticsRoutes);


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
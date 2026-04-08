# OrderFlow Analytics

E-commerce platform con motor de análisis de comportamiento de clientes construido con React, Node.js y PostgreSQL.

## Stack

- **Frontend**: React + Vite, Recharts, React Router
- **Backend**: Node.js, Express, JWT
- **Base de datos**: PostgreSQL (Window Functions, CTEs, Triggers)

## Funcionalidades

- Autenticación con JWT y control de roles (admin / customer)
- Catálogo de productos con búsqueda y filtros
- Carrito y checkout con transacciones ACID
- Dashboard analytics con métricas en tiempo real
- Segmentación RFM de clientes
- Top productos y tendencias de ventas con LAG()

## Instalación

### Requisitos
- Node.js 18+
- PostgreSQL 14+

### Base de datos
```sql
CREATE DATABASE orderflow_db;
-- Ejecutar schema.sql en pgAdmin
```

### Backend
```bash
cd backend
npm install
cp .env.example .env   # configura tus variables
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Variables de entorno

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orderflow_db
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=clave_secreta
```

## Conceptos de PostgreSQL aplicados

| Concepto | Dónde se usa |
|---|---|
| Window Functions (RANK, LAG) | Analytics de clientes y tendencias |
| CTEs (WITH) | Segmentación RFM |
| Triggers | Descuento automático de stock |
| Transacciones ACID | Checkout de órdenes |
| Índices | Optimización de queries analíticos |
| Vistas materializadas | Reportes de ventas |
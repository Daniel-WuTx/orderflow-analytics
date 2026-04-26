// backend/src/infrastructure/db/seed.js
const pool = require('./pool.js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const USERS    = 500;
const PRODUCTS = 200;
const ORDERS   = 5000;
const REVIEWS  = 1000;

const rnd  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndF = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const pick  = arr => arr[rnd(0, arr.length - 1)];
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) },
    (_, i) => arr.slice(i * size, i * size + size));

const FIRST_NAMES = ['Carlos','Laura','Andrés','Sofía','Miguel','Valentina',
  'Sebastián','Isabella','Julián','Camila','Daniel','María','Santiago','Paula',
  'David','Ana','Luis','Diana','Jorge','Natalia'];

const LAST_NAMES = ['García','Rodríguez','Martínez','López','González',
  'Pérez','Sánchez','Ramírez','Torres','Flores','Rivera','Gómez',
  'Díaz','Herrera','Morales','Jiménez','Reyes','Cruz','Vargas','Mendoza'];

const CATEGORY_NAMES = [
  { name: 'Electrónica',  slug: 'electronica'  },
  { name: 'Ropa',         slug: 'ropa'          },
  { name: 'Hogar',        slug: 'hogar'         },
  { name: 'Deportes',     slug: 'deportes'      },
  { name: 'Libros',       slug: 'libros'        },
  { name: 'Juguetes',     slug: 'juguetes'      },
  { name: 'Belleza',      slug: 'belleza'       },
  { name: 'Alimentación', slug: 'alimentacion'  },
];

const PRODUCT_PREFIXES = ['Pro','Ultra','Max','Smart','Eco',
  'Premium','Basic','Plus','Elite','Lite'];
const PRODUCT_NOUNS = ['Monitor','Teclado','Mouse','Camisa','Zapatos',
  'Silla','Mesa','Bicicleta','Libro','Cámara','Auriculares','Lámpara',
  'Bolsa','Reloj','Tablet','Camiseta','Pantalón','Licuadora','Cafetera','Parlante'];

const PROVIDERS = ['wompi','stripe'];

const weightedStatus = () => {
  const r = Math.random();
  if (r < 0.60) return 'delivered';
  if (r < 0.75) return 'shipped';
  if (r < 0.85) return 'processing';
  if (r < 0.93) return 'pending';
  return 'cancelled';
};

const rndDate = () => {
  const now         = Date.now();
  const twoYearsAgo = now - 2 * 365 * 24 * 60 * 60 * 1000;
  return new Date(twoYearsAgo + Math.random() * (now - twoYearsAgo));
};

async function seed() {
  // ── Usamos DOS conexiones separadas ──────────────────────────────────────
  // ddlClient: solo para DDL (DISABLE/ENABLE TRIGGER) — nunca abre transacción
  // txClient : para todo el DML dentro de BEGIN/COMMIT
  const ddlClient = await pool.connect();
  const txClient  = await pool.connect();

  try {
    // 1) Deshabilitar trigger ANTES de abrir la transacción, en conexión DDL
    console.log('⚙️  Deshabilitando trigger decrease_stock...');
    await ddlClient.query('DROP TRIGGER IF EXISTS trg_decrease_stock ON order_items');

    // 2) Abrir transacción en la conexión de DML
    await txClient.query('BEGIN');
    console.log('🌱 Iniciando seed...\n');

    // 0) Limpiar tablas
    console.log('🧹 Limpiando tablas...');
    await txClient.query(`
      TRUNCATE payment_intents, order_items, orders,
               reviews, product_images, products,
               categories, users
      RESTART IDENTITY CASCADE
    `);

    // 1) Categorías
    console.log('📦 Insertando categorías...');
    const catIds = [];
    for (const cat of CATEGORY_NAMES) {
      const { rows } = await txClient.query(
        `INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id`,
        [cat.name, cat.slug]
      );
      catIds.push(rows[0].id);
    }

    // 2) Usuarios
    console.log(`👤 Insertando ${USERS} usuarios...`);
    const passwordHash = await bcrypt.hash('password123', 10);
    const userIds = [];

    const { rows: [sa] } = await txClient.query(
      `INSERT INTO users (id, name, email, password_hash, role)
       VALUES ($1,$2,$3,$4,'superadmin') RETURNING id`,
      [uuidv4(), 'Super Admin', 'superadmin@orderflow.com', passwordHash]
    );
    userIds.push(sa.id);

    for (let i = 1; i <= 5; i++) {
      const { rows: [u] } = await txClient.query(
        `INSERT INTO users (id, name, email, password_hash, role)
         VALUES ($1,$2,$3,$4,'admin') RETURNING id`,
        [uuidv4(), `Admin ${i}`, `admin${i}@orderflow.com`, passwordHash]
      );
      userIds.push(u.id);
    }

    const customerBatch = [];
    for (let i = 0; i < USERS - 6; i++) {
      const name  = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const email = `user${i}_${Date.now()}@mail.com`;
      customerBatch.push([uuidv4(), name, email, passwordHash, 'customer']);
    }

    for (const batch of chunk(customerBatch, 100)) {
      const vals = batch.map((_, i) =>
        `($${i*5+1},$${i*5+2},$${i*5+3},$${i*5+4},$${i*5+5})`).join(',');
      const { rows } = await txClient.query(
        `INSERT INTO users (id,name,email,password_hash,role) VALUES ${vals} RETURNING id`,
        batch.flat()
      );
      rows.forEach(r => userIds.push(r.id));
    }

    const customerIds = userIds.slice(6);

    // 3) Productos
    console.log(`🛒 Insertando ${PRODUCTS} productos...`);
    const productIds    = [];
    const productPrices = {};

    const prodBatch = [];
    for (let i = 0; i < PRODUCTS; i++) {
      const name  = `${pick(PRODUCT_PREFIXES)} ${pick(PRODUCT_NOUNS)} ${i + 1}`;
      const price = rndF(5, 500);
      const stock = rnd(50, 500); // mínimo 50 para que el trigger no llegue a 0
      prodBatch.push([uuidv4(), pick(catIds), name,
        `Descripción del producto ${name}`, price, stock]);
    }

    for (const batch of chunk(prodBatch, 50)) {
      const vals = batch.map((_, i) =>
        `($${i*6+1},$${i*6+2},$${i*6+3},$${i*6+4},$${i*6+5},$${i*6+6})`).join(',');
      const { rows } = await txClient.query(
        `INSERT INTO products (id,category_id,name,description,price,stock)
         VALUES ${vals} RETURNING id, price`,
        batch.flat()
      );
      rows.forEach(r => {
        productIds.push(r.id);
        productPrices[r.id] = parseFloat(r.price);
      });
    }

    // 4) Órdenes + items + pagos
    console.log(`📋 Insertando ${ORDERS} órdenes...`);
    let totalOrders = 0;

    for (const batch of chunk(Array.from({ length: ORDERS }), 200)) {
      const orderRows   = [];
      const itemRows    = [];
      const paymentRows = [];

      for (let i = 0; i < batch.length; i++) {
        const orderId   = uuidv4();
        const userId    = pick(customerIds);
        const status    = weightedStatus();
        const createdAt = rndDate();
        const numItems  = rnd(1, 6);
        let   total     = 0;

        const itemsForOrder = [];
        for (let j = 0; j < numItems; j++) {
          const productId = pick(productIds);
          const qty       = rnd(1, 3);
          const unitPrice = productPrices[productId];
          total += qty * unitPrice;
          itemsForOrder.push([uuidv4(), orderId, productId, qty, unitPrice]);
        }

        total = +total.toFixed(2);
        orderRows.push([orderId, userId, status, total, createdAt]);
        itemsForOrder.forEach(it => itemRows.push(it));

        if (status !== 'pending' && status !== 'cancelled') {
          paymentRows.push([
            uuidv4(), userId, orderId,
            uuidv4(),
            total, 'COP', 'approved',
            pick(PROVIDERS), uuidv4(),
            JSON.stringify({ gateway_ref: uuidv4() }),
            createdAt
          ]);
        }
      }

      const oVals = orderRows.map((_, i) =>
        `($${i*5+1},$${i*5+2},$${i*5+3},$${i*5+4},$${i*5+5})`).join(',');
      await txClient.query(
        `INSERT INTO orders (id,user_id,status,total,created_at) VALUES ${oVals}`,
        orderRows.flat()
      );

      for (const sub of chunk(itemRows, 500)) {
        const iVals = sub.map((_, i) =>
          `($${i*5+1},$${i*5+2},$${i*5+3},$${i*5+4},$${i*5+5})`).join(',');
        await txClient.query(
          `INSERT INTO order_items (id,order_id,product_id,quantity,unit_price) VALUES ${iVals}`,
          sub.flat()
        );
      }

      if (paymentRows.length) {
        for (const sub of chunk(paymentRows, 200)) {
          const pVals = sub.map((_, i) =>
            `($${i*11+1},$${i*11+2},$${i*11+3},$${i*11+4},$${i*11+5},$${i*11+6},$${i*11+7},$${i*11+8},$${i*11+9},$${i*11+10},$${i*11+11})`).join(',');
          await txClient.query(
            `INSERT INTO payment_intents
             (id,user_id,order_id,idempotency_key,amount,currency,status,provider,provider_id,metadata,created_at)
             VALUES ${pVals}`,
            sub.flat()
          );
        }
      }

      totalOrders += batch.length;
      console.log(`   ✓ ${totalOrders}/${ORDERS} órdenes procesadas`);
    }

    // 5) Reviews
    console.log(`⭐ Insertando ${REVIEWS} reviews...`);
    const reviewBatch = [];
    for (let i = 0; i < REVIEWS; i++) {
      reviewBatch.push([
        uuidv4(), pick(customerIds), pick(productIds),
        rnd(1, 5),
        `Reseña número ${i + 1}. Muy buen producto.`,
        rndDate()
      ]);
    }

    for (const sub of chunk(reviewBatch, 200)) {
      const rVals = sub.map((_, i) =>
        `($${i*6+1},$${i*6+2},$${i*6+3},$${i*6+4},$${i*6+5},$${i*6+6})`).join(',');
      await txClient.query(
        `INSERT INTO reviews (id,user_id,product_id,rating,comment,created_at) VALUES ${rVals}`,
        sub.flat()
      );
    }

    // 3) Confirmar transacción DML
    await txClient.query('COMMIT');
    console.log('\n✅ Datos insertados, rehabilitando trigger...');

    // 4) Rehabilitar trigger en la conexión DDL (fuera de transacción)
    await ddlClient.query(`
      CREATE TRIGGER trg_decrease_stock
      AFTER INSERT ON order_items
      FOR EACH ROW EXECUTE FUNCTION decrease_stock()
    `);
    console.log('⚙️  Trigger rehabilitado.\n');

    // Resumen
    const tables = ['users','categories','products','orders',
                    'order_items','reviews','payment_intents'];
    console.log('📊 Resumen final:\n');
    for (const t of tables) {
      const { rows } = await txClient.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`   ${t.padEnd(20)} ${rows[0].count} registros`);
    }

  } catch (err) {
    await txClient.query('ROLLBACK').catch(() => {});
    // Siempre rehabilitar el trigger aunque falle
    await ddlClient.query('ALTER TABLE products ENABLE TRIGGER ALL').catch(() => {});
    console.error('❌ Error en seed, rollback aplicado:', err.message);
    throw err;
  } finally {
    ddlClient.release();
    txClient.release();
    await pool.end();
  }
}

seed();
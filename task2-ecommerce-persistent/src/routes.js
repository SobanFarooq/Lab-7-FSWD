const express = require('express');
const db = require('./db');

const router = express.Router();
const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const wrap = (fn) => (req, res, next) => {
  try { fn(req, res, next); } catch (e) { next(e); }
};
const id = (req) => {
  const n = Number(req.params.id);
  if (!Number.isInteger(n)) throw new HttpError(400, 'id must be an integer');
  return n;
};
const need = (body, fields) => {
  const missing = fields.filter((f) => body[f] === undefined || body[f] === '');
  if (missing.length) throw new HttpError(400, `Missing required field(s): ${missing.join(', ')}`);
};

// ======================= CATEGORIES =======================
router.post('/categories', wrap((req, res) => {
  need(req.body, ['name']);
  const r = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)')
    .run(req.body.name, req.body.description ?? null);
  res.status(201).json(db.prepare('SELECT * FROM categories WHERE id = ?').get(r.lastInsertRowid));
}));
router.get('/categories', wrap((req, res) => {
  const data = db.prepare('SELECT * FROM categories ORDER BY id').all();
  res.json({ count: data.length, data });
}));
router.get('/categories/:id', wrap((req, res) => {
  const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id(req));
  if (!row) throw new HttpError(404, 'Category not found');
  res.json(row);
}));
router.put('/categories/:id', wrap((req, res) => {
  need(req.body, ['name']);
  const r = db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?')
    .run(req.body.name, req.body.description ?? null, id(req));
  if (!r.changes) throw new HttpError(404, 'Category not found');
  res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(id(req)));
}));
router.delete('/categories/:id', wrap((req, res) => {
  const r = db.prepare('DELETE FROM categories WHERE id = ?').run(id(req));
  if (!r.changes) throw new HttpError(404, 'Category not found');
  res.json({ message: 'Category deleted' });
}));

// ======================= PRODUCTS =======================
router.post('/products', wrap((req, res) => {
  need(req.body, ['name', 'price']);
  const { name, description, price, stock = 0, category_id } = req.body;
  const r = db.prepare('INSERT INTO products (name, description, price, stock, category_id) VALUES (?, ?, ?, ?, ?)')
    .run(name, description ?? null, price, stock, category_id ?? null);
  res.status(201).json(db.prepare('SELECT * FROM products WHERE id = ?').get(r.lastInsertRowid));
}));
// supports ?category_id=, ?search=, ?minPrice=, ?maxPrice=
router.get('/products', wrap((req, res) => {
  const where = [];
  const params = [];
  if (req.query.category_id) { where.push('category_id = ?'); params.push(Number(req.query.category_id)); }
  if (req.query.search) { where.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${req.query.search}%`, `%${req.query.search}%`); }
  if (req.query.minPrice) { where.push('price >= ?'); params.push(Number(req.query.minPrice)); }
  if (req.query.maxPrice) { where.push('price <= ?'); params.push(Number(req.query.maxPrice)); }
  const sql = `SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`;
  const data = db.prepare(sql).all(...params);
  res.json({ count: data.length, data });
}));
router.get('/products/:id', wrap((req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id(req));
  if (!row) throw new HttpError(404, 'Product not found');
  res.json(row);
}));
router.put('/products/:id', wrap((req, res) => {
  need(req.body, ['name', 'price']);
  const { name, description, price, stock = 0, category_id } = req.body;
  const r = db.prepare('UPDATE products SET name=?, description=?, price=?, stock=?, category_id=? WHERE id=?')
    .run(name, description ?? null, price, stock, category_id ?? null, id(req));
  if (!r.changes) throw new HttpError(404, 'Product not found');
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(id(req)));
}));
router.patch('/products/:id', wrap((req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id = ?').get(id(req));
  if (!cur) throw new HttpError(404, 'Product not found');
  const m = { ...cur, ...req.body };
  db.prepare('UPDATE products SET name=?, description=?, price=?, stock=?, category_id=? WHERE id=?')
    .run(m.name, m.description, m.price, m.stock, m.category_id, cur.id);
  res.json(db.prepare('SELECT * FROM products WHERE id = ?').get(cur.id));
}));
router.delete('/products/:id', wrap((req, res) => {
  const r = db.prepare('DELETE FROM products WHERE id = ?').run(id(req));
  if (!r.changes) throw new HttpError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
}));

// ======================= CUSTOMERS =======================
router.post('/customers', wrap((req, res) => {
  need(req.body, ['name', 'email']);
  const { name, email, phone, address } = req.body;
  const r = db.prepare('INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)')
    .run(name, email, phone ?? null, address ?? null);
  res.status(201).json(db.prepare('SELECT * FROM customers WHERE id = ?').get(r.lastInsertRowid));
}));
router.get('/customers', wrap((req, res) => {
  const data = db.prepare('SELECT * FROM customers ORDER BY id').all();
  res.json({ count: data.length, data });
}));
router.get('/customers/:id', wrap((req, res) => {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id(req));
  if (!row) throw new HttpError(404, 'Customer not found');
  res.json(row);
}));
router.put('/customers/:id', wrap((req, res) => {
  need(req.body, ['name', 'email']);
  const { name, email, phone, address } = req.body;
  const r = db.prepare('UPDATE customers SET name=?, email=?, phone=?, address=? WHERE id=?')
    .run(name, email, phone ?? null, address ?? null, id(req));
  if (!r.changes) throw new HttpError(404, 'Customer not found');
  res.json(db.prepare('SELECT * FROM customers WHERE id = ?').get(id(req)));
}));
router.delete('/customers/:id', wrap((req, res) => {
  const cid = id(req);
  if (db.prepare('SELECT 1 FROM orders WHERE customer_id = ?').get(cid))
    throw new HttpError(409, 'Cannot delete a customer who has orders');
  const r = db.prepare('DELETE FROM customers WHERE id = ?').run(cid);
  if (!r.changes) throw new HttpError(404, 'Customer not found');
  res.json({ message: 'Customer deleted' });
}));

// ======================= CART (per customer) =======================
const getCart = (customerId) => {
  if (!db.prepare('SELECT 1 FROM customers WHERE id = ?').get(customerId))
    throw new HttpError(404, 'Customer not found');
  const items = db.prepare(`
    SELECT ci.id, ci.product_id, p.name, p.price, ci.quantity, (p.price * ci.quantity) AS subtotal
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    WHERE ci.customer_id = ? ORDER BY ci.id`).all(customerId);
  return { customer_id: customerId, items, total: items.reduce((s, i) => s + i.subtotal, 0) };
};
router.get('/customers/:id/cart', wrap((req, res) => res.json(getCart(id(req)))));
router.post('/customers/:id/cart', wrap((req, res) => {
  const cid = id(req);
  need(req.body, ['product_id']);
  const qty = Number(req.body.quantity ?? 1);
  if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'quantity must be a positive integer');
  getCart(cid);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.body.product_id);
  if (!product) throw new HttpError(404, 'Product not found');
  const existing = db.prepare('SELECT quantity FROM cart_items WHERE customer_id=? AND product_id=?').get(cid, product.id);
  const newQty = (existing?.quantity ?? 0) + qty;
  if (newQty > product.stock) throw new HttpError(400, `Only ${product.stock} unit(s) in stock`);
  db.prepare(`INSERT INTO cart_items (customer_id, product_id, quantity) VALUES (?, ?, ?)
              ON CONFLICT(customer_id, product_id) DO UPDATE SET quantity = excluded.quantity`)
    .run(cid, product.id, newQty);
  res.status(201).json(getCart(cid));
}));
router.put('/customers/:id/cart/:productId', wrap((req, res) => {
  const cid = id(req);
  const qty = Number(req.body.quantity);
  if (!Number.isInteger(qty) || qty < 1) throw new HttpError(400, 'quantity must be a positive integer');
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.productId));
  if (!product) throw new HttpError(404, 'Product not found');
  if (qty > product.stock) throw new HttpError(400, `Only ${product.stock} unit(s) in stock`);
  const r = db.prepare('UPDATE cart_items SET quantity=? WHERE customer_id=? AND product_id=?').run(qty, cid, product.id);
  if (!r.changes) throw new HttpError(404, 'Item not in cart');
  res.json(getCart(cid));
}));
router.delete('/customers/:id/cart/:productId', wrap((req, res) => {
  const cid = id(req);
  const r = db.prepare('DELETE FROM cart_items WHERE customer_id=? AND product_id=?').run(cid, Number(req.params.productId));
  if (!r.changes) throw new HttpError(404, 'Item not in cart');
  res.json(getCart(cid));
}));
router.delete('/customers/:id/cart', wrap((req, res) => {
  const cid = id(req);
  getCart(cid);
  db.prepare('DELETE FROM cart_items WHERE customer_id = ?').run(cid);
  res.json({ message: 'Cart cleared' });
}));

// ======================= ORDERS =======================
const getOrder = (orderId) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) throw new HttpError(404, 'Order not found');
  order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  return order;
};

// Checkout: turns the customer's cart into an order, reduces stock, clears the cart
router.post('/orders', wrap((req, res) => {
  need(req.body, ['customer_id']);
  const cid = Number(req.body.customer_id);
  const order = db.transaction(() => {
    const cart = getCart(cid);
    if (!cart.items.length) throw new HttpError(400, 'Cart is empty');
    const r = db.prepare('INSERT INTO orders (customer_id, total) VALUES (?, ?)').run(cid, cart.total);
    for (const it of cart.items) {
      const upd = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?')
        .run(it.quantity, it.product_id, it.quantity);
      if (!upd.changes) throw new HttpError(400, `Not enough stock for "${it.name}"`);
      db.prepare('INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?,?,?,?,?)')
        .run(r.lastInsertRowid, it.product_id, it.name, it.price, it.quantity);
    }
    db.prepare('DELETE FROM cart_items WHERE customer_id = ?').run(cid);
    return getOrder(r.lastInsertRowid);
  });
  res.status(201).json(order);
}));
router.get('/orders', wrap((req, res) => {
  const data = req.query.customer_id
    ? db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY id').all(Number(req.query.customer_id))
    : db.prepare('SELECT * FROM orders ORDER BY id').all();
  res.json({ count: data.length, data });
}));
router.get('/orders/:id', wrap((req, res) => res.json(getOrder(id(req)))));
router.patch('/orders/:id/status', wrap((req, res) => {
  const oid = id(req);
  const { status } = req.body;
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
  const cur = getOrder(oid);
  db.transaction(() => {
    // cancelling puts the stock back
    if (status === 'cancelled' && cur.status !== 'cancelled') {
      for (const it of cur.items)
        if (it.product_id) db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(it.quantity, it.product_id);
    }
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, oid);
  });
  res.json(getOrder(oid));
}));
router.delete('/orders/:id', wrap((req, res) => {
  const r = db.prepare('DELETE FROM orders WHERE id = ?').run(id(req));
  if (!r.changes) throw new HttpError(404, 'Order not found');
  res.json({ message: 'Order deleted' });
}));

// ---------- error handler ----------
router.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (/UNIQUE constraint/i.test(err.message)) return res.status(409).json({ error: 'Duplicate value: ' + err.message });
  if (/constraint/i.test(err.message)) return res.status(400).json({ error: 'Invalid data: ' + err.message });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;

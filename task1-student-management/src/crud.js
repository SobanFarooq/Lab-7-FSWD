// Generic in-memory CRUD router factory.
// Data lives in a JS array, so it is lost when the server restarts.
const express = require('express');

function createCrudRouter({ name, fields, required, validate }) {
  const router = express.Router();
  const items = [];
  let nextId = 1;

  const pick = (body) => {
    const out = {};
    for (const f of fields) if (body[f] !== undefined) out[f] = body[f];
    return out;
  };

  // CREATE
  router.post('/', (req, res) => {
    const data = pick(req.body);
    const missing = required.filter((f) => data[f] === undefined || data[f] === '');
    if (missing.length) return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    const err = validate && validate(data, 'create');
    if (err) return res.status(err.status || 400).json({ error: err.message });
    const item = { id: nextId++, ...data, createdAt: new Date().toISOString() };
    items.push(item);
    res.status(201).json(item);
  });

  // READ ALL (supports ?field=value filtering)
  router.get('/', (req, res) => {
    let result = items;
    for (const f of fields) {
      if (req.query[f] !== undefined) result = result.filter((i) => String(i[f]) === String(req.query[f]));
    }
    res.json({ count: result.length, data: result });
  });

  // READ ONE
  router.get('/:id', (req, res) => {
    const item = items.find((i) => i.id === Number(req.params.id));
    if (!item) return res.status(404).json({ error: `${name} not found` });
    res.json(item);
  });

  // UPDATE (PUT = full replace of fields, PATCH = partial)
  const update = (partial) => (req, res) => {
    const idx = items.findIndex((i) => i.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: `${name} not found` });
    const data = partial ? { ...items[idx], ...pick(req.body) } : { ...pick(req.body) };
    const missing = required.filter((f) => data[f] === undefined || data[f] === '');
    if (missing.length) return res.status(400).json({ error: `Missing required field(s): ${missing.join(', ')}` });
    const err = validate && validate(data, 'update', items[idx]);
    if (err) return res.status(err.status || 400).json({ error: err.message });
    const { id, createdAt } = items[idx];
    items[idx] = { id, ...data, createdAt, updatedAt: new Date().toISOString() };
    // keep id/createdAt intact even if present in data
    items[idx].id = id;
    res.json(items[idx]);
  };
  router.put('/:id', update(false));
  router.patch('/:id', update(true));

  // DELETE
  router.delete('/:id', (req, res) => {
    const idx = items.findIndex((i) => i.id === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ error: `${name} not found` });
    const [removed] = items.splice(idx, 1);
    res.json({ message: `${name} deleted`, data: removed });
  });

  router.items = items; // exposed so other modules can check references
  return router;
}

module.exports = createCrudRouter;

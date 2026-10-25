const express = require('express');
const routes = require('./src/routes');

const app = express();
app.use(express.json());

app.get('/', (req, res) =>
  res.json({
    message: 'E-commerce Store API (persistent - SQLite)',
    endpoints: ['/categories', '/products', '/customers', '/customers/:id/cart', '/orders'],
  })
);
app.use('/', routes);
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) app.listen(PORT, () => console.log(`E-commerce API on http://localhost:${PORT}`));
module.exports = app;

const createCrudRouter = require('./crud');

module.exports = createCrudRouter({
  name: 'Teacher',
  fields: ['name', 'email', 'subject', 'phone'],
  required: ['name', 'subject'],
});

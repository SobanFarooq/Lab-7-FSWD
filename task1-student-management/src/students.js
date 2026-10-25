const createCrudRouter = require('./crud');

module.exports = createCrudRouter({
  name: 'Student',
  fields: ['name', 'email', 'rollNo', 'className', 'age', 'phone'],
  required: ['name', 'rollNo', 'className'],
});

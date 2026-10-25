const createCrudRouter = require('./crud');
const students = require('./students');
const teachers = require('./teachers');

const STATUSES = ['present', 'absent', 'leave'];

module.exports = createCrudRouter({
  name: 'Attendance record',
  fields: ['studentId', 'teacherId', 'date', 'status', 'subject'],
  required: ['studentId', 'date', 'status'],
  validate(data) {
    if (!students.items.some((s) => s.id === Number(data.studentId)))
      return { status: 404, message: `Student ${data.studentId} does not exist` };
    if (data.teacherId !== undefined && !teachers.items.some((t) => t.id === Number(data.teacherId)))
      return { status: 404, message: `Teacher ${data.teacherId} does not exist` };
    if (!STATUSES.includes(data.status))
      return { message: `status must be one of: ${STATUSES.join(', ')}` };
    if (Number.isNaN(Date.parse(data.date))) return { message: 'date must be a valid date (YYYY-MM-DD)' };
    data.studentId = Number(data.studentId);
    if (data.teacherId !== undefined) data.teacherId = Number(data.teacherId);
  },
});

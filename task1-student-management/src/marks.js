const createCrudRouter = require('./crud');
const students = require('./students');
const teachers = require('./teachers');

module.exports = createCrudRouter({
  name: 'Marks record',
  fields: ['studentId', 'teacherId', 'subject', 'examType', 'marksObtained', 'totalMarks'],
  required: ['studentId', 'subject', 'marksObtained', 'totalMarks'],
  validate(data) {
    if (!students.items.some((s) => s.id === Number(data.studentId)))
      return { status: 404, message: `Student ${data.studentId} does not exist` };
    if (data.teacherId !== undefined && !teachers.items.some((t) => t.id === Number(data.teacherId)))
      return { status: 404, message: `Teacher ${data.teacherId} does not exist` };
    const obtained = Number(data.marksObtained);
    const total = Number(data.totalMarks);
    if (Number.isNaN(obtained) || Number.isNaN(total) || total <= 0 || obtained < 0)
      return { message: 'marksObtained and totalMarks must be valid numbers (totalMarks > 0)' };
    if (obtained > total) return { message: 'marksObtained cannot exceed totalMarks' };
    data.studentId = Number(data.studentId);
    if (data.teacherId !== undefined) data.teacherId = Number(data.teacherId);
    data.marksObtained = obtained;
    data.totalMarks = total;
    data.percentage = Number(((obtained / total) * 100).toFixed(2));
  },
});

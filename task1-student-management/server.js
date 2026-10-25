const express = require('express');
const students = require('./src/students');
const teachers = require('./src/teachers');
const attendance = require('./src/attendance');
const marks = require('./src/marks');

const app = express();
app.use(express.json());

app.get('/', (req, res) =>
  res.json({
    message: 'Student Management System (in-memory API) - no authorization required',
    endpoints: ['/students', '/teachers', '/attendance', '/marks'],
  })
);

app.use('/students', students);
app.use('/teachers', teachers);
app.use('/attendance', attendance);
app.use('/marks', marks);

// Extra: all info about one student in one call
app.get('/students/:id/report', (req, res) => {
  const id = Number(req.params.id);
  const student = students.items.find((s) => s.id === id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json({
    student,
    attendance: attendance.items.filter((a) => a.studentId === id),
    marks: marks.items.filter((m) => m.studentId === id),
  });
});

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) app.listen(PORT, () => console.log(`Student Management API on http://localhost:${PORT}`));
module.exports = app;

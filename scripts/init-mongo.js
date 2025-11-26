// MongoDB initialization script
db = db.getSiblingDB('algorithmic-challenges');

// Create collections
db.createCollection('users');
db.createCollection('challenges');
db.createCollection('submissions');
db.createCollection('courses');
db.createCollection('evaluations');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

db.challenges.createIndex({ courseId: 1 });
db.challenges.createIndex({ status: 1 });
db.challenges.createIndex({ difficulty: 1 });
db.challenges.createIndex({ tags: 1 });
db.challenges.createIndex({ createdBy: 1 });
db.challenges.createIndex({ title: 'text', description: 'text' });

db.submissions.createIndex({ userId: 1 });
db.submissions.createIndex({ challengeId: 1 });
db.submissions.createIndex({ courseId: 1 });
db.submissions.createIndex({ status: 1 });
db.submissions.createIndex({ language: 1 });
db.submissions.createIndex({ createdAt: -1 });
db.submissions.createIndex({ userId: 1, challengeId: 1 });

db.courses.createIndex({ code: 1 }, { unique: true });
db.courses.createIndex({ professorIds: 1 });
db.courses.createIndex({ studentIds: 1 });
db.courses.createIndex({ period: 1 });
db.courses.createIndex({ isActive: 1 });

db.evaluations.createIndex({ courseId: 1 });
db.evaluations.createIndex({ status: 1 });
db.evaluations.createIndex({ startDate: 1 });
db.evaluations.createIndex({ endDate: 1 });
db.evaluations.createIndex({ createdBy: 1 });

// Create default admin user
db.users.insertOne({
  email: 'admin@example.com',
  password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', // password: admin123
  firstName: 'Admin',
  lastName: 'User',
  role: 'ADMIN',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Database initialized successfully');


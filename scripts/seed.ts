#!/usr/bin/env ts-node

/**
 * Script de semilla para poblar la base de datos con datos iniciales
 * 
 * Uso:
 *   npm run seed
 *   npm run seed:reset  (elimina todos los datos y vuelve a crear)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoUserRepository } from '../src/adapters/repositories/MongoUserRepository';
import { MongoChallengeRepository } from '../src/adapters/repositories/MongoChallengeRepository';
import { MockCourseRepository } from '../src/adapters/repositories/MockCourseRepository';
import { UserRole } from '../src/domain/entities/User';
import { ChallengeDifficulty, ChallengeStatus } from '../src/domain/entities/Challenge';

const DATABASE_URL = process.env.DATABASE_URL || 
  'mongodb://admin:password123@localhost:27017/algorithmic-challenges?authSource=admin';

async function seed() {
  console.log('🌱 Iniciando seed de base de datos...\n');

  try {
    // Conectar a MongoDB
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Conectado a MongoDB\n');

    const userRepo = new MongoUserRepository();
    const challengeRepo = new MongoChallengeRepository();
    const courseRepo = new MockCourseRepository();

    // ===== USUARIOS =====
    console.log('👤 Creando usuarios...');
    
    // Usar 12 salt rounds como en AuthService
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Función helper para crear o actualizar usuario
    const createOrUpdateUser = async (email: string, userData: any) => {
      const existing = await userRepo.findByEmail(email);
      if (existing) {
        console.log(`  ⚠️  Usuario ${email} ya existe, actualizando contraseña...`);
        // Actualizar contraseña del usuario existente
        const updated = await userRepo.update(existing.id, {
          ...userData,
          password: hashedPassword
        });
        return updated || existing;
      }
      return await userRepo.create(userData);
    };

    const admin = await createOrUpdateUser('admin@example.com', {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });
    console.log(`  ✅ Admin: ${admin.email}`);

    const professor = await createOrUpdateUser('professor@example.com', {
      email: 'professor@example.com',
      password: hashedPassword,
      firstName: 'Professor',
      lastName: 'User',
      role: UserRole.PROFESSOR,
    });
    console.log(`  ✅ Professor: ${professor.email}`);

    const student1 = await createOrUpdateUser('student@example.com', {
      email: 'student@example.com',
      password: hashedPassword,
      firstName: 'Student',
      lastName: 'One',
      role: UserRole.STUDENT,
    });
    console.log(`  ✅ Student: ${student1.email}`);

    const student2 = await createOrUpdateUser('student2@example.com', {
      email: 'student2@example.com',
      password: hashedPassword,
      firstName: 'Student',
      lastName: 'Two',
      role: UserRole.STUDENT,
    });
    console.log(`  ✅ Student 2: ${student2.email}\n`);
    
    // Verificar que las contraseñas funcionan
    console.log('🔐 Verificando contraseñas...');
    const testPassword = '123456';
    const testHash = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, testHash);
    console.log(`  ✅ Verificación de hash: ${isValid ? 'OK' : 'ERROR'}\n`);

    // ===== CURSO =====
    console.log('📚 Creando curso...');
    
    const course = await courseRepo.create({
      name: 'Algoritmos y Estructuras de Datos',
      code: 'CS101',
      description: 'Curso introductorio de algoritmos y estructuras de datos fundamentales',
      period: '2025-1',
      group: 1,
      professorIds: [professor.id],
      createdBy: professor.id,
    });
    console.log(`  ✅ Curso creado: ${course.name} (${course.code})\n`);

    // Inscribir estudiantes
    await courseRepo.enrollStudent(course.id, student1.id);
    await courseRepo.enrollStudent(course.id, student2.id);
    console.log('  ✅ Estudiantes inscritos en el curso\n');

    // ===== CHALLENGES =====
    console.log('🎯 Creando challenges...');

    // Challenge 1: Two Sum
    const twoSum = await challengeRepo.create({
      title: 'Two Sum',
      description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

Example 1:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Example 2:
Input: nums = [3,2,4], target = 6
Output: [1,2]

Example 3:
Input: nums = [3,3], target = 6
Output: [0,1]`,
      difficulty: ChallengeDifficulty.EASY,
      tags: ['array', 'hash-table'],
      timeLimit: 1000,
      memoryLimit: 256,
      courseId: course.id,
      createdBy: professor.id,
      status: ChallengeStatus.PUBLISHED,
      testCases: [
        {
          input: JSON.stringify({ nums: [2, 7, 11, 15], target: 9 }),
          expectedOutput: JSON.stringify([0, 1]),
          isHidden: false,
          order: 1,
        },
        {
          input: JSON.stringify({ nums: [3, 2, 4], target: 6 }),
          expectedOutput: JSON.stringify([1, 2]),
          isHidden: false,
          order: 2,
        },
        {
          input: JSON.stringify({ nums: [3, 3], target: 6 }),
          expectedOutput: JSON.stringify([0, 1]),
          isHidden: false,
          order: 3,
        },
        {
          input: JSON.stringify({ nums: [1, 5, 3, 7, 9], target: 10 }),
          expectedOutput: JSON.stringify([1, 3]),
          isHidden: true,
          order: 4,
        },
      ],
    });
    console.log(`  ✅ Challenge creado: ${twoSum.title}`);

    // Challenge 2: Reverse String
    const reverseString = await challengeRepo.create({
      title: 'Reverse String',
      description: `Write a function that takes a string as input and returns the string reversed.

Example 1:
Input: "hello"
Output: "olleh"

Example 2:
Input: "world"
Output: "dlrow"

Constraints:
- The input string will only contain lowercase letters and spaces
- The string length will be between 1 and 1000 characters`,
      difficulty: ChallengeDifficulty.EASY,
      tags: ['string', 'algorithms', 'basic'],
      timeLimit: 1000,
      memoryLimit: 256,
      courseId: course.id,
      createdBy: professor.id,
      status: ChallengeStatus.PUBLISHED,
      testCases: [
        {
          input: JSON.stringify({ str: 'hello' }),
          expectedOutput: JSON.stringify('olleh'),
          isHidden: false,
          order: 1,
        },
        {
          input: JSON.stringify({ str: 'world' }),
          expectedOutput: JSON.stringify('dlrow'),
          isHidden: false,
          order: 2,
        },
        {
          input: JSON.stringify({ str: 'a' }),
          expectedOutput: JSON.stringify('a'),
          isHidden: false,
          order: 3,
        },
        {
          input: JSON.stringify({ str: 'algorithm' }),
          expectedOutput: JSON.stringify('mhtirogla'),
          isHidden: false,
          order: 4,
        },
        {
          input: JSON.stringify({ str: 'racecar' }),
          expectedOutput: JSON.stringify('racecar'),
          isHidden: true,
          order: 5,
        },
      ],
    });
    console.log(`  ✅ Challenge creado: ${reverseString.title}`);

    // Challenge 3: Valid Parentheses
    const validParentheses = await challengeRepo.create({
      title: 'Valid Parentheses',
      description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example 1:
Input: s = "()"
Output: true

Example 2:
Input: s = "()[]{}"
Output: true

Example 3:
Input: s = "(]"
Output: false`,
      difficulty: ChallengeDifficulty.MEDIUM,
      tags: ['stack', 'string'],
      timeLimit: 1000,
      memoryLimit: 256,
      courseId: course.id,
      createdBy: professor.id,
      status: ChallengeStatus.PUBLISHED,
      testCases: [
        {
          input: JSON.stringify({ s: '()' }),
          expectedOutput: JSON.stringify(true),
          isHidden: false,
          order: 1,
        },
        {
          input: JSON.stringify({ s: '()[]{}' }),
          expectedOutput: JSON.stringify(true),
          isHidden: false,
          order: 2,
        },
        {
          input: JSON.stringify({ s: '(]' }),
          expectedOutput: JSON.stringify(false),
          isHidden: false,
          order: 3,
        },
        {
          input: JSON.stringify({ s: '([)]' }),
          expectedOutput: JSON.stringify(false),
          isHidden: true,
          order: 4,
        },
      ],
    });
    console.log(`  ✅ Challenge creado: ${validParentheses.title}\n`);

    console.log('✅ Seed completado exitosamente!\n');
    console.log('📋 Resumen:');
    console.log(`  - ${4} usuarios creados`);
    console.log(`  - ${1} curso creado`);
    console.log(`  - ${3} challenges creados\n`);
    console.log('🔑 Credenciales de prueba:');
    console.log('  Admin: admin@example.com / 123456');
    console.log('  Professor: professor@example.com / 123456');
    console.log('  Student: student@example.com / 123456');
    console.log('  Student 2: student2@example.com / 123456\n');

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Desconectado de MongoDB');
  }
}

async function reset() {
  console.log('🗑️  Eliminando todos los datos...\n');

  try {
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('No se pudo obtener la base de datos');
    }

    const collections = await db.listCollections().toArray();
    
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
      console.log(`  ✅ Colección ${collection.name} limpiada`);
    }

    console.log('\n✅ Base de datos limpiada\n');
    await mongoose.disconnect();

    // Ejecutar seed después de reset
    await seed();
  } catch (error) {
    console.error('❌ Error durante el reset:', error);
    throw error;
  }
}

// Ejecutar
const command = process.argv[2];

if (command === 'reset') {
  reset().catch(console.error);
} else {
  seed().catch(console.error);
}


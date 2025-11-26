/**
 * Ejemplos de Uso del Sistema de Ejecución de Código en Docker
 * 
 * Este archivo muestra cómo usar el RunnerService para ejecutar código
 * de estudiantes en contenedores Docker aislados y seguro.
 */

import { RunnerService } from './src/frameworks/RunnerService';
import { ProgrammingLanguage, SubmissionStatus } from './src/domain/entities/Submission';
import { RunnerConfig } from './src/domain/services/IRunnerService';

/**
 * Ejemplo 1: Función Simple de Multiplicación
 */
async function example1SimpleFunction() {
  console.log('\n========== EJEMPLO 1: Función Simple ==========\n');

  const runner = new RunnerService();

  const config: RunnerConfig = {
    language: ProgrammingLanguage.JAVASCRIPT,
    code: `
      function main(getInput) {
        const n = parseInt(getInput());
        return n * 2;
      }
    `,
    timeLimit: 5000,
    memoryLimit: 512,
    testCases: [
      {
        id: 'test-1',
        input: '5',
        expectedOutput: '10',
        isHidden: false
      },
      {
        id: 'test-2',
        input: '10',
        expectedOutput: '20',
        isHidden: false
      },
      {
        id: 'test-3',
        input: '0',
        expectedOutput: '0',
        isHidden: false
      }
    ]
  };

  const result = await runner.executeCode(config);

  console.log(`📊 Resultados:`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Score: ${result.score.toFixed(1)}%`);
  console.log(`   Tiempo total: ${result.timeMsTotal}ms`);
  console.log(`   Memoria total: ${result.memoryKbTotal}KB`);
  console.log(`\n📋 Detalle de casos:`);

  result.testCaseResults.forEach(tc => {
    const icon = tc.status === SubmissionStatus.ACCEPTED ? '✅' : '❌';
    console.log(`   ${icon} ${tc.caseId}: ${tc.status}`);
    if (tc.actualOutput !== tc.expectedOutput) {
      console.log(`      Input: ${tc.actualOutput}`);
      console.log(`      Expected: ${tc.expectedOutput}`);
    }
  });
}

/**
 * Ejemplo 2: Código con Error (Falla una prueba)
 */
async function example2PartiallyCorrect() {
  console.log('\n========== EJEMPLO 2: Código Parcialmente Correcto ==========\n');

  const runner = new RunnerService();

  const config: RunnerConfig = {
    language: ProgrammingLanguage.JAVASCRIPT,
    code: `
      function main(getInput) {
        const n = parseInt(getInput());
        // Intencional: multiplicar por 3 en lugar de 2
        return n * 3;
      }
    `,
    timeLimit: 5000,
    memoryLimit: 512,
    testCases: [
      {
        id: 'test-1',
        input: '5',
        expectedOutput: '10',
        isHidden: false
      },
      {
        id: 'test-2',
        input: '3',
        expectedOutput: '9',
        isHidden: false
      }
    ]
  };

  const result = await runner.executeCode(config);

  console.log(`Score: ${result.score}%`);
  console.log(`Status: ${result.status}`);

  result.testCaseResults.forEach(tc => {
    console.log(`\nTest ${tc.caseId}:`);
    console.log(`  Status: ${tc.status}`);
    console.log(`  Expected: "${tc.expectedOutput}"`);
    console.log(`  Got: "${tc.actualOutput}"`);
    console.log(`  Time: ${tc.timeMs}ms`);
  });
}

/**
 * Ejemplo 3: Código con Error de Ejecución
 */
async function example3RuntimeError() {
  console.log('\n========== EJEMPLO 3: Error en Tiempo de Ejecución ==========\n');

  const runner = new RunnerService();

  const config: RunnerConfig = {
    language: ProgrammingLanguage.JAVASCRIPT,
    code: `
      function main(getInput) {
        // Intencional: causará un error
        const obj = null;
        return obj.property;
      }
    `,
    timeLimit: 5000,
    memoryLimit: 512,
    testCases: [
      {
        id: 'test-1',
        input: 'ignored',
        expectedOutput: 'something',
        isHidden: false
      }
    ]
  };

  const result = await runner.executeCode(config);

  console.log(`Status: ${result.status}`);
  console.log(`Error: ${result.errorMessage || result.testCaseResults[0]?.errorMessage}`);
}

/**
 * Ejemplo 4: Función Más Compleja - FizzBuzz
 */
async function example4FizzBuzz() {
  console.log('\n========== EJEMPLO 4: FizzBuzz ==========\n');

  const runner = new RunnerService();

  const code = `
    function main(getInput) {
      const n = parseInt(getInput());
      let result = [];
      
      for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) {
          result.push('FizzBuzz');
        } else if (i % 3 === 0) {
          result.push('Fizz');
        } else if (i % 5 === 0) {
          result.push('Buzz');
        } else {
          result.push(i);
        }
      }
      
      return result.join('\\n');
    }
  `;

  const config: RunnerConfig = {
    language: ProgrammingLanguage.JAVASCRIPT,
    code,
    timeLimit: 5000,
    memoryLimit: 512,
    testCases: [
      {
        id: 'test-small',
        input: '15',
        expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',
        isHidden: false
      }
    ]
  };

  const result = await runner.executeCode(config);

  console.log(`Status: ${result.status}`);
  console.log(`Score: ${result.score}%`);
  console.log(`Execution Time: ${result.timeMsTotal}ms`);

  if (result.testCaseResults[0]) {
    const tc = result.testCaseResults[0];
    console.log(`\nOutput (first 100 chars):`);
    console.log(`"${(tc.actualOutput || '').substring(0, 100)}..."`);
  }
}

/**
 * Ejemplo 5: Medir Impacto de Límite de Tiempo
 */
async function example5TimeLimit() {
  console.log('\n========== EJEMPLO 5: Test de Límite de Tiempo ==========\n');

  const runner = new RunnerService();

  const code = `
    function main(getInput) {
      const n = parseInt(getInput());
      
      // Loop que toma tiempo dependiendo de n
      let sum = 0;
      for (let i = 0; i < n * 1000000; i++) {
        sum += i;
      }
      
      return sum;
    }
  `;

  // Primer test: tiempo suficiente
  console.log('Test 1: Tiempo límite = 5000ms');
  let config: RunnerConfig = {
    language: ProgrammingLanguage.JAVASCRIPT,
    code,
    timeLimit: 5000,
    memoryLimit: 512,
    testCases: [
      {
        id: 'fast',
        input: '10',
        expectedOutput: '49999950000000',
        isHidden: false
      }
    ]
  };

  let result = await runner.executeCode(config);
  console.log(`  Status: ${result.status}`);
  console.log(`  Time: ${result.testCaseResults[0]?.timeMs}ms\n`);

  // Segundo test: tiempo insuficiente
  console.log('Test 2: Tiempo límite = 100ms (probablemente timeout)');
  config.timeLimit = 100;
  result = await runner.executeCode(config);
  console.log(`  Status: ${result.status}`);
  console.log(`  Error: ${result.testCaseResults[0]?.errorMessage || 'N/A'}`);
}

/**
 * Ejemplo 6: TypeScript
 */
async function example6TypeScript() {
  console.log('\n========== EJEMPLO 6: TypeScript ==========\n');

  const runner = new RunnerService();

  const code = `
    interface NumberPair {
      a: number;
      b: number;
    }
    
    function main(getInput: (prompt?: string) => string): number {
      const input = parseInt(getInput());
      const pair: NumberPair = { a: input, b: input * 2 };
      return pair.a + pair.b;
    }
  `;

  const config: RunnerConfig = {
    language: ProgrammingLanguage.JAVASCRIPT,
    code,
    timeLimit: 5000,
    memoryLimit: 512,
    testCases: [
      {
        id: 'ts-test-1',
        input: '5',
        expectedOutput: '15', // 5 + 10
        isHidden: false
      }
    ]
  };

  const result = await runner.executeCode(config);
  console.log(`Status: ${result.status}`);
  console.log(`Score: ${result.score}%`);
  if (result.testCaseResults[0]) {
    console.log(`Output: ${result.testCaseResults[0].actualOutput}`);
  }
}

/**
 * Función auxiliar para ejecutar todos los ejemplos
 */
async function runAllExamples() {
  try {
    await example1SimpleFunction();
    await example2PartiallyCorrect();
    await example3RuntimeError();
    await example4FizzBuzz();
    await example5TimeLimit();
    await example6TypeScript();

    console.log('\n✅ Todos los ejemplos completados exitosamente\n');
  } catch (error) {
    console.error('❌ Error ejecutando ejemplos:', error);
  }
}

// Descomenta para ejecutar:
// runAllExamples();

// O ejecuta ejemplos individuales:
// example1SimpleFunction();

export {
  example1SimpleFunction,
  example2PartiallyCorrect,
  example3RuntimeError,
  example4FizzBuzz,
  example5TimeLimit,
  example6TypeScript,
  runAllExamples
};

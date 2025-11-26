import { ContainerCodeExecutor } from '../src/frameworks/ContainerCodeExecutor';
import { ProgrammingLanguage } from '../src/domain/entities/Submission';

(async () => {
  const executor = new ContainerCodeExecutor();
  const config = {
    language: ProgrammingLanguage.JAVASCRIPT,
    code: `function main(getInput){ const n = parseInt(getInput()); return n * 3; }`,
    timeLimit: 5000,
    memoryLimit: 512,
    testCases: [
      { id: 'test-1', input: '5', expectedOutput: '10', isHidden: false }
    ]
  } as any;

  const res = await executor.executeCode(config);
  console.log('Result:', JSON.stringify(res, null, 2));

  await executor.cleanup();
})();

import { spawn, SpawnOptions } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Utilidades para ejecutar comandos Docker de forma segura y robusta
 */
export class DockerUtils {
  /**
   * Ejecuta un comando y retorna su salida
   */
  static async executeCommand(
    command: string,
    args: string[],
    options?: SpawnOptions
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, code: code || 0 });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Verifica si Docker está disponible
   */
  static async isDockerAvailable(): Promise<boolean> {
    try {
      const result = await this.executeCommand('docker', ['--version']);
      return result.code === 0;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la imagen de Docker
   */
  static async getDockerImage(imageName: string): Promise<boolean> {
    try {
      const result = await this.executeCommand('docker', ['images', imageName, '-q']);
      return result.code === 0 && result.stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Construye una imagen Docker
   */
  static async buildDockerImage(
    dockerfile: string,
    imageName: string,
    buildContext: string = '.'
  ): Promise<void> {
    const result = await this.executeCommand('docker', [
      'build',
      '-f',
      dockerfile,
      '-t',
      imageName,
      buildContext
    ]);

    if (result.code !== 0) {
      throw new Error(`Failed to build Docker image: ${result.stderr}`);
    }
  }

  /**
   * Limpia contenedores que contienen un patrón en el nombre
   */
  static async cleanupContainersMatching(pattern: string): Promise<void> {
    try {
      const result = await this.executeCommand('docker', [
        'ps',
        '-a',
        '--filter',
        `name=${pattern}`,
        '-q'
      ]);

      if (result.code === 0 && result.stdout.trim()) {
        const containerIds = result.stdout.trim().split('\n');
        for (const id of containerIds) {
          await this.executeCommand('docker', ['rm', '-f', id]);
        }
      }
    } catch (error) {
      // Ignorar errores de limpieza
    }
  }

  /**
   * Obtiene estadísticas de memoria de un contenedor
   */
  static async getContainerMemoryUsage(containerId: string): Promise<number | null> {
    try {
      const result = await this.executeCommand('docker', [
        'stats',
        '--no-stream',
        containerId,
        '--format',
        '{{.MemoryPerc}}'
      ]);

      if (result.code === 0) {
        // Parsear porcentaje de memoria
        const memoryStr = result.stdout.trim();
        return parseFloat(memoryStr);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Crea un volumen temporal para archivos
   */
  static createTempVolume(): { path: string; cleanup: () => void } {
    const tempPath = path.join(
      process.env.TEMP || '/tmp',
      `docker-volume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    );

    fs.mkdirSync(tempPath, { recursive: true });

    return {
      path: tempPath,
      cleanup: () => {
        try {
          fs.rmSync(tempPath, { recursive: true, force: true });
        } catch {
          // Ignorar errores
        }
      }
    };
  }

  /**
   * Escribe un archivo en un volumen temporal
   */
  static writeToTempVolume(volumePath: string, filename: string, content: string): string {
    const filePath = path.join(volumePath, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  /**
   * Lee un archivo de un volumen temporal
   */
  static readFromTempVolume(volumePath: string, filename: string): string | null {
    const filePath = path.join(volumePath, filename);
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return null;
    }
  }
}

/**
 * Construcción segura de argumentos Docker run
 */
export class DockerRunBuilder {
  private args: string[] = ['run'];

  /**
   * Nombre del contenedor
   */
  containerName(name: string): this {
    this.args.push('--name', name);
    return this;
  }

  /**
   * Elimina el contenedor automáticamente al terminar
   */
  autoRemove(): this {
    this.args.push('--rm');
    return this;
  }

  /**
   * Configura la red
   */
  network(network: string): this {
    this.args.push('--network', network);
    return this;
  }

  /**
   * Configura límites de CPU
   */
  cpuLimit(cpus: number): this {
    this.args.push('--cpus', cpus.toString());
    return this;
  }

  /**
   * Configura límites de memoria
   */
  memoryLimit(memoryMb: number): this {
    this.args.push('--memory', `${memoryMb}m`);
    this.args.push('--memory-swap', `${memoryMb}m`);
    return this;
  }

  /**
   * Configura el sistema de archivos como read-only
   */
  readOnly(): this {
    this.args.push('--read-only');
    return this;
  }

  /**
   * Crea un volumen temporal en memoria
   */
  tmpfs(path: string, options: string = 'rw,size=100m'): this {
    this.args.push('--tmpfs', `${path}:${options}`);
    return this;
  }

  /**
   * Limita el número de procesos
   */
  pidsLimit(limit: number): this {
    this.args.push('--pids-limit', limit.toString());
    return this;
  }

  /**
   * Monta un volumen
   */
  volume(hostPath: string, containerPath: string, readOnly: boolean = false): this {
    const volumeStr = readOnly ? `${hostPath}:${containerPath}:ro` : `${hostPath}:${containerPath}`;
    this.args.push('--volume', volumeStr);
    return this;
  }

  /**
   * Elimina todas las capacidades de Linux
   */
  dropAllCapabilities(): this {
    this.args.push('--cap-drop', 'ALL');
    return this;
  }

  /**
   * Establece opciones de seguridad
   */
  securityOpt(option: string): this {
    this.args.push('--security-opt', option);
    return this;
  }

  /**
   * Establece timeout
   */
  timeout(seconds: number): this {
    this.args.push('--timeout', seconds.toString());
    return this;
  }

  /**
   * Agrega variable de entorno
   */
  env(key: string, value: string): this {
    this.args.push('--env', `${key}=${value}`);
    return this;
  }

  /**
   * Especifica la imagen
   */
  image(imageName: string): this {
    this.args.push(imageName);
    return this;
  }

  /**
   * Agrega comando y argumentos
   */
  command(...cmd: string[]): this {
    this.args.push(...cmd);
    return this;
  }

  /**
   * Retorna los argumentos construidos
   */
  build(): string[] {
    return [...this.args];
  }
}

/**
 * Builder para un contenedor JavaScript/TypeScript seguro
 */
export class SecureNodeRunner {
  /**
   * Crea los argumentos para ejecutar código JavaScript de forma segura
   */
  static buildRunCommand(
    containerName: string,
    codeFilePath: string,
    options: {
      timeLimit?: number;
      memoryLimit?: number;
      cpuLimit?: number;
    } = {}
  ): string[] {
    const {
      timeLimit = 30,
      memoryLimit = 512,
      cpuLimit = 0.5
    } = options;

    return new DockerRunBuilder()
      .containerName(containerName)
      .autoRemove()
      .network('none')
      .cpuLimit(cpuLimit)
      .memoryLimit(memoryLimit)
      .readOnly()
      .tmpfs('/tmp', 'rw,size=100m,noexec')
      .tmpfs('/run', 'rw,size=50m,noexec')
      .pidsLimit(10)
      .dropAllCapabilities()
      .securityOpt('no-new-privileges')
      .volume(codeFilePath, '/code.js', true)
      .timeout(timeLimit)
      .image('node:18-alpine')
      .command('timeout', timeLimit.toString(), 'node', '/code.js')
      .build();
  }
}

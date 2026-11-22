import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

/** Parámetros OWASP para Argon2id (19 MiB, 2 iteraciones, 1 hilo). */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordService {
  private dummyHash?: string;

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, ARGON2_OPTIONS);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      // Hash corrupto o algoritmo desconocido: se trata como credencial inválida.
      return false;
    }
  }

  /**
   * Verifica contra un hash ficticio cuando el correo no existe, para que el tiempo de
   * respuesta no revele si la cuenta existe.
   */
  async verifyAgainstDummy(plain: string): Promise<false> {
    this.dummyHash ??= await this.hash('contraseña-ficticia-para-igualar-tiempos');
    await argon2.verify(this.dummyHash, plain).catch(() => false);
    return false;
  }
}

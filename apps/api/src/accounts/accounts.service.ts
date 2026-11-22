import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Account } from '@prisma/client';
import type { CreateAccountInput, UpdateAccountInput } from '@binomo/contracts';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AccountView {
  id: string;
  name: string;
  type: Account['type'];
  currency: string;
  openingBalanceMinor: string;
  confirmedBalanceMinor: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export function toAccountView(account: Account): AccountView {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    currency: account.currency,
    openingBalanceMinor: account.openingBalanceMinor.toString(),
    confirmedBalanceMinor: account.confirmedBalanceMinor?.toString() ?? null,
    archivedAt: account.archivedAt?.toISOString() ?? null,
    createdAt: account.createdAt.toISOString(),
  };
}

function isDuplicateName(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    String(error.meta?.target).includes('name')
  );
}

@Injectable()
export class AccountsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async list(userId: string, includeArchived = false): Promise<AccountView[]> {
    const accounts = await this.prisma.account.findMany({
      where: { userId, ...(includeArchived ? {} : { archivedAt: null }) },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map(toAccountView);
  }

  async create(userId: string, input: CreateAccountInput): Promise<AccountView> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const account = await tx.account.create({
          data: {
            userId,
            name: input.name,
            type: input.type,
            currency: input.currency,
            openingBalanceMinor: input.openingBalanceMinor,
          },
        });

        // El saldo inicial no se teclea dos veces: queda como movimiento de apertura.
        if (input.openingBalanceMinor > 0n) {
          await tx.transaction.create({
            data: {
              userId,
              accountId: account.id,
              type: 'DEPOSIT',
              amountMinor: input.openingBalanceMinor,
              occurredAt: new Date(),
              source: 'MANUAL',
              notes: 'Movimiento de apertura',
            },
          });
        }

        return toAccountView(account);
      });
    } catch (error) {
      if (isDuplicateName(error)) {
        throw new ConflictException('Ya tienes una cuenta con ese nombre');
      }

      throw error;
    }
  }

  async get(userId: string, accountId: string): Promise<AccountView> {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      // 404 y no 403: no se confirma si la cuenta existe en otra cuenta de usuario.
      throw new NotFoundException('Cuenta no encontrada');
    }

    return toAccountView(account);
  }

  async update(userId: string, accountId: string, input: UpdateAccountInput): Promise<AccountView> {
    await this.get(userId, accountId);

    try {
      const account = await this.prisma.account.update({
        where: { id: accountId },
        data: { name: input.name },
      });

      return toAccountView(account);
    } catch (error) {
      if (isDuplicateName(error)) {
        throw new ConflictException('Ya tienes una cuenta con ese nombre');
      }

      throw error;
    }
  }

  /** Borrado lógico: el historial financiero nunca se destruye. */
  async archive(userId: string, accountId: string): Promise<AccountView> {
    await this.get(userId, accountId);

    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { archivedAt: new Date() },
    });

    return toAccountView(account);
  }

  async restore(userId: string, accountId: string): Promise<AccountView> {
    await this.get(userId, accountId);

    const account = await this.prisma.account.update({
      where: { id: accountId },
      data: { archivedAt: null },
    });

    return toAccountView(account);
  }
}

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Account } from '@prisma/client';
import { AccountsService } from '../src/accounts/accounts.service.js';
import type { PrismaService } from '../src/prisma/prisma.service.js';

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    userId: 'u1',
    name: 'Cuenta real',
    type: 'REAL',
    currency: 'EUR',
    openingBalanceMinor: 100_000n,
    confirmedBalanceMinor: null,
    confirmedAt: null,
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function duplicateNameError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('nombre duplicado', {
    code: 'P2002',
    clientVersion: '6.19.3',
    meta: { target: ['user_id', 'name'] },
  });
}

describe('AccountsService.create', () => {
  it('registra el saldo inicial como movimiento de apertura', async () => {
    const tx = {
      account: { create: jest.fn().mockResolvedValue(makeAccount()) },
      transaction: { create: jest.fn().mockResolvedValue({ id: 't1' }) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;

    const account = await new AccountsService(prisma).create('u1', {
      name: 'Cuenta real',
      type: 'REAL',
      currency: 'EUR',
      openingBalanceMinor: 100_000n,
    });

    expect(account.openingBalanceMinor).toBe('100000');
    expect(account.currency).toBe('EUR');
    expect(tx.transaction.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        accountId: 'a1',
        type: 'DEPOSIT',
        amountMinor: 100_000n,
        occurredAt: expect.any(Date),
        source: 'MANUAL',
        notes: 'Movimiento de apertura',
      },
    });
  });

  it('no crea movimiento cuando la cuenta se abre en cero', async () => {
    const tx = {
      account: { create: jest.fn().mockResolvedValue(makeAccount({ openingBalanceMinor: 0n })) },
      transaction: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    } as unknown as PrismaService;

    await new AccountsService(prisma).create('u1', {
      name: 'Demo',
      type: 'DEMO',
      currency: 'USD',
      openingBalanceMinor: 0n,
    });

    expect(tx.transaction.create).not.toHaveBeenCalled();
  });

  it('responde 409 si el usuario ya tiene una cuenta con ese nombre', async () => {
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(duplicateNameError()),
    } as unknown as PrismaService;

    await expect(
      new AccountsService(prisma).create('u1', {
        name: 'Cuenta real',
        type: 'REAL',
        currency: 'EUR',
        openingBalanceMinor: 0n,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('AccountsService.get', () => {
  it('consulta siempre con el userId del token (IDOR)', async () => {
    const prisma = {
      account: { findFirst: jest.fn().mockResolvedValue(makeAccount()) },
    } as unknown as PrismaService;

    await new AccountsService(prisma).get('u1', 'a1');

    expect(prisma.account.findFirst).toHaveBeenCalledWith({ where: { id: 'a1', userId: 'u1' } });
  });

  it('devuelve 404 cuando la cuenta es de otro usuario', async () => {
    const prisma = {
      account: { findFirst: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    await expect(new AccountsService(prisma).get('u2', 'a1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AccountsService.archive', () => {
  it('archiva sin borrar el historial', async () => {
    const prisma = {
      account: {
        findFirst: jest.fn().mockResolvedValue(makeAccount()),
        update: jest.fn().mockResolvedValue(makeAccount({ archivedAt: new Date() })),
      },
    } as unknown as PrismaService;

    const account = await new AccountsService(prisma).archive('u1', 'a1');

    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { archivedAt: expect.any(Date) },
    });
    expect(account.archivedAt).not.toBeNull();
  });
});

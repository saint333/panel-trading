import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { UpdateSettingsInput, UserSettingsView } from '@binomo/contracts';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from '../auth/auth.service.js';

export interface MeOverview {
  user: Awaited<ReturnType<AuthService['getPublicUser']>>;
  settings: UserSettingsView;
}

function toSettingsView(settings: {
  theme: string;
  weekStartsOn: number;
  defaultAccountId: string | null;
  notifyDaily: boolean;
  notifyWeekly: boolean;
}): UserSettingsView {
  return {
    theme: settings.theme as UserSettingsView['theme'],
    weekStartsOn: settings.weekStartsOn,
    defaultAccountId: settings.defaultAccountId,
    notifyDaily: settings.notifyDaily,
    notifyWeekly: settings.notifyWeekly,
  };
}

@Injectable()
export class MeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuthService) private readonly auth: AuthService,
  ) {}

  async overview(userId: string): Promise<MeOverview> {
    const [user, settings] = await Promise.all([
      this.auth.getPublicUser(userId),
      this.settings(userId),
    ]);

    return { user, settings };
  }

  async settings(userId: string): Promise<UserSettingsView> {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return toSettingsView(settings);
  }

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<UserSettingsView> {
    if (input.defaultAccountId) {
      const account = await this.prisma.account.findFirst({
        where: { id: input.defaultAccountId, userId, archivedAt: null },
        select: { id: true },
      });

      if (!account) {
        throw new BadRequestException('La cuenta predeterminada no existe o está archivada');
      }
    }

    const { timezone, locale, theme, weekStartsOn, defaultAccountId } = input;

    const [settings] = await this.prisma.$transaction([
      this.prisma.userSettings.upsert({
        where: { userId },
        create: { userId, theme, weekStartsOn, defaultAccountId },
        update: { theme, weekStartsOn, defaultAccountId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { timezone, locale },
      }),
    ]);

    return toSettingsView(settings);
  }
}

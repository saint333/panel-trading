import { Controller, Get, Inject } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HealthService, type LivenessResult, type ReadinessResult } from './health.service.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness: el proceso responde' })
  @ApiOkResponse({ description: 'Servicio operativo' })
  liveness(): LivenessResult {
    return this.health.liveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness: base de datos accesible' })
  @ApiOkResponse({ description: 'Base de datos disponible' })
  @ApiServiceUnavailableResponse({ description: 'Base de datos no disponible' })
  readiness(): Promise<ReadinessResult> {
    return this.health.readiness();
  }
}

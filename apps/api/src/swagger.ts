import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, version: string): void {
  const config = new DocumentBuilder()
    .setTitle('Binomo Analytics API')
    .setDescription(
      'API de registro y análisis. No ejecuta operaciones ni se conecta a Binomo. ' +
        'Los importes viajan siempre como enteros en unidades menores (string).',
    )
    .setVersion(version)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('v1/docs', app, document, {
    jsonDocumentUrl: 'v1/docs-json',
    swaggerOptions: { persistAuthorization: true },
  });
}

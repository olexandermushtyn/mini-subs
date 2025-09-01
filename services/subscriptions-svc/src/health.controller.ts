import { Controller, Get } from '@nestjs/common';

@Controller('v1/subscriptions')
export class HealthController {
  @Get('health')
  health() {
    return { ok: true };
  }
}

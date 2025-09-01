import { Controller, Get } from '@nestjs/common';

@Controller('v1/auth')
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'auth-svc',
      timestamp: new Date().toISOString(),
    };
  }
}

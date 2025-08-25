import { Global, Module } from '@nestjs/common';
import { fetch } from 'undici';

@Global()
@Module({
  providers: [
    {
      provide: 'HTTP_CLIENT',
      useValue: fetch,
    },
  ],
  exports: ['HTTP_CLIENT'],
})
export class HttpClientModule {}

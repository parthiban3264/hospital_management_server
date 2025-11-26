// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super(); 
    
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}


// // src/prisma/prisma.service.ts
// import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';
// import { ConfigService } from '@nestjs/config';
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';  // ← Correct import
// import * as mariadb from 'mariadb';  // ← Use mariadb driver
// import * as url from 'url';  // For parsing DATABASE_URL

// @Injectable()
// export class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   private readonly logger = new Logger(PrismaService.name);

//   constructor(private readonly configService: ConfigService) {
//     super();

//     // 1. Parse DATABASE_URL (e.g., "mysql://user:pass@host:port/db")
//     const dbUrl = this.configService.get<string>('DATABASE_URL');
//     if (!dbUrl) {
//       throw new Error('DATABASE_URL is required');
//     }
//     const parsedUrl = new url.URL(dbUrl.replace('mysql://', 'http://'));  // url module needs http/https scheme

//     // Extract connection options
//     const connectionOptions: mariadb.ConnectionOptions = {
//       host: parsedUrl.hostname,
//       port: Number(parsedUrl.port) || 3306,
//       user: parsedUrl.username,
//       password: parsedUrl.password || '',
//       database: parsedUrl.pathname.slice(1),  // Remove leading '/'
//       // Optional: Add extras like connectionLimit, acquireTimeout, etc.
//       connectionLimit: 10,
//       acquireTimeout: 60000,
//       // If using SSL: ssl: { rejectUnauthorized: false } (for self-signed certs)
//     };

//     // 2. Create a connection pool (required by the MariaDB adapter)
//     const pool = mariadb.createPool(connectionOptions);

//     // 3. Create the adapter
//     const adapter = new PrismaMariaDb(pool);

//     // 4. Re-create PrismaClient with the adapter
//     const clientWithAdapter = new PrismaClient({
//       adapter,                                    // ← This is the key
//       log: ['query', 'info', 'warn', 'error'],   // Optional: Logging (remove 'query' in prod)
//     });

//     // 5. Replace the current instance with the one that has the adapter
//     Object.assign(this, clientWithAdapter);
//   }

//   async onModuleInit() {
//     try {
//       await this.$connect();
//       this.logger.log('Prisma MySQL connected successfully');
//     } catch (error) {
//       this.logger.error('Failed to connect to Prisma', error);
//       throw error;
//     }
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//     this.logger.log('Prisma disconnected');
//   }
// }
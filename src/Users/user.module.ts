import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../jwt/jwt.strategy";

@Module({
  imports: [
     JwtModule.register({
      secret: "46501720c4de4deea09d4f960fa2313f",
      signOptions: { expiresIn: "60d" },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, PrismaService,JwtStrategy],
})
export class UserModule {}

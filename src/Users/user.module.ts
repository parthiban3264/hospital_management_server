import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { PrismaService } from "src/prisma/prisma.service";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "../jwt/jwt.strategy";

@Module({
  imports: [
     JwtModule.register({
      secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiaWF0IjoxNzU5NzQ0ODQ0LCJleHAiOjE3NjQ5Mjg4NDR9.rgToyms64UJEpp4iekgzeJ5YXUcPZpjOn8s8S7j1x4E",
      signOptions: { expiresIn: "60d" },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, PrismaService,JwtStrategy],
})
export class UserModule {}

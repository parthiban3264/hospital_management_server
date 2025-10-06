import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: "46501720c4de4deea09d4f960fa2313f",
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      role: payload.role,
      hospitalId: payload.hospitalId,
      userIdCustom: payload.userId,
    };
  }
}

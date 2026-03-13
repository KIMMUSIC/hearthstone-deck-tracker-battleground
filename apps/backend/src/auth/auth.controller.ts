import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCallbackDto } from './dto/auth-callback.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async callback(@Body() dto: AuthCallbackDto) {
    const tokenResponse = await this.authService.exchangeCode(dto.code, dto.redirect_uri);
    const userInfo = await this.authService.getUserInfo(tokenResponse.access_token);
    const user = await this.authService.upsertUser(userInfo.battletag, userInfo.sub);
    const tokens = await this.authService.generateTokens(user.id);

    return {
      ...tokens,
      battleTag: user.battleTag,
      battleNetId: user.battleNetId,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    const user = await this.authService.verifyRefreshToken(dto.refreshToken);
    return this.authService.generateTokens(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('register-client')
  @HttpCode(HttpStatus.OK)
  async registerClient(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterClientDto,
  ) {
    await this.authService.registerClientSecret(userId, dto.clientSecret);
    return { success: true };
  }
}

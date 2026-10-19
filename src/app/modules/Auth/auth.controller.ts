import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthServices } from './auth.service';
import ApiError from '../../../errors/ApiErrors';
import config from '../../../config';

/**
 * The refresh token is delivered as an httpOnly cookie by the backend.
 * In production the frontend runs on a different site, so the cookie must
 * be SameSite=None (which requires Secure) to be sent with credentialed
 * cross-origin requests. On localhost, Lax is enough (same site across
 * ports) and keeps local http development working.
 */
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: (config.env === 'production' ? 'none' : 'lax') as
    | 'none'
    | 'lax',
};

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await AuthServices.loginUser({ email, password });
  const { refreshToken } = result;

  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Login Successful',
    data: result,
  });
});

const refresh = catchAsync(async (req: Request, res: Response) => {
  // Accept the httpOnly cookie (normal flow) or a token in the request
  // body (fallback for clients where cross-site cookies are blocked).
  const tokenFromCookie = req.cookies?.refreshToken;
  const tokenFromBody = req.body?.refreshToken;
  const token = tokenFromCookie || tokenFromBody;

  if (!token) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Refresh token is missing! Please log in again.'
    );
  }

  const result = await AuthServices.refreshToken(token);

  res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Token refreshed successfully',
    data: result,
  });
});

export const AuthController = {
  loginUser,
  refresh,
};

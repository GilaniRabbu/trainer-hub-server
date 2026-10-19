import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import { jwtHelpers } from '../../../helpars/jwtHelpers';
import ApiError from '../../../errors/ApiErrors';
import User from '../User/user.model';

const loginUser = async (payload: {
  email: string;
  password: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  user: any;
}> => {
  // Check if user exists by phone
  const user = await User.findOne({ email: payload.email });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User Not Found');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Password');
  }

  // Create JWT payload
  const jwtPayload = {
    id: user._id,
    phone: user.phone,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  // Generate tokens
  const accessToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.access_token_secret as Secret,
    config.jwt.access_token_expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  // Never expose the password hash (or internal version field) to the client
  const userObject = user.toObject() as Record<string, unknown>;
  delete userObject.password;
  delete userObject.__v;

  return {
    accessToken,
    refreshToken,
    user: userObject,
  };
};

/**
 * Exchange a valid refresh token for a fresh access token (and a rotated
 * refresh token). The refresh token is verified against its own secret,
 * and the user is re-checked from the database so deleted or blocked
 * accounts cannot mint new access tokens.
 */
const refreshToken = async (token: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  let verified: any;
  try {
    verified = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as Secret
    );
  } catch {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token!');
  }

  if (!verified?.id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token!');
  }

  const user = await User.findById(verified.id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found!');
  }
  if (user.isDeleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This user is deleted!');
  }
  if (user.userStatus === 'BLOCKED') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Your account is blocked!');
  }

  const jwtPayload = {
    id: user._id,
    phone: user.phone,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const newAccessToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.access_token_secret as Secret,
    config.jwt.access_token_expires_in as string
  );

  const newRefreshToken = jwtHelpers.generateToken(
    jwtPayload,
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const AuthServices = {
  loginUser,
  refreshToken,
};

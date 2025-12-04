/*eslint-disable*/

import * as bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiErrors';
import User from './user.model'; // Mongoose model

const createUser = async (payload: any): Promise<any> => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      'User already exists with this email'
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Replace plain password with hashed one
  const userData = {
    ...payload,
    password: hashedPassword,
  };

  // Create user
  const user = await User.create(userData);

  return user;
};

const getStatistics = async (): Promise<{
  totalServiceProviders: number;
  totalCustomers: number;
  totalCategories: number;
  totalLocations: number;
}> => {
  const totalServiceProviders = await User.countDocuments({
    role: 'SERVICE_PROVIDER',
  });
  const totalCustomers = await User.countDocuments({ role: 'USER' });

  const categories = await User.distinct('profession', {
    role: 'SERVICE_PROVIDER',
  });
  const locations = await User.distinct('location', {
    role: 'SERVICE_PROVIDER',
  });

  return {
    totalServiceProviders,
    totalCustomers,
    totalCategories: categories.length,
    totalLocations: locations.length,
  };
};
export const UserService = {
  createUser,
  getStatistics,
};

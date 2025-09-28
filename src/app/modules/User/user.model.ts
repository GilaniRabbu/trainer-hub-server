import { Schema, model } from 'mongoose';

const UserSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'USER', 'TRAINER'],
      required: true,
      default: 'USER',
    },
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    userStatus: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING', 'DELETED'],
      default: 'ACTIVE',
    },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: true },

    profession: {
      type: String,
      required: false,
      enum: [
        'Yoga Instructor',
        'Fitness Instructor',
        'Chiropractor',
        'Athletic Trainer',
        'Pilates Instructor',
        'Personal Trainer',
        'Meditation Coach',
        'Nutrition Coach',
        'Boxing Trainer',
      ],
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    experienceYears: {
      type: Number,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      required: false,
    },
    profilePicture: { type: String },
    location: {
      type: String,
    },

    refreshToken: { type: String },
    refreshTokenExpiry: { type: Date },
    isRegistered: { type: Boolean },
    otp: { type: Number },
    otpExpiry: { type: Date },
    otpToken: { type: String },

    isDeleted: { type: Boolean },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ userStatus: 1 });
UserSchema.index({ role: 1 });

const User = model('User', UserSchema);

export default User;

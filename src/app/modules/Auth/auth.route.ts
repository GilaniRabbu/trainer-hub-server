import express from 'express';
import { AuthController } from './auth.controller';

const router = express.Router();

// user login route
router.post('/login', AuthController.loginUser);

// exchange a valid refresh token (httpOnly cookie or body) for a new
// access token; unauthenticated requests get a 401
router.post('/refresh-token', AuthController.refresh);

export const AuthRoute = router;

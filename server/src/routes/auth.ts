import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const router = Router();

// Mock user data (in production, this would be in a database)
const users = [
  {
    id: '1',
    username: 'analyst',
    email: 'analyst@wartracker.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'analyst',
    permissions: ['read:events', 'read:analytics', 'read:countries']
  },
  {
    id: '2',
    username: 'admin',
    email: 'admin@wartracker.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    role: 'admin',
    permissions: ['read:all', 'write:all', 'admin:all']
  }
];

// POST /api/auth/login - User login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
      return;
    }

    // Find user
    const user = users.find(u => u.username === username || u.email === username);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    logger.info(`User logged in: ${user.username} (${user.role})`);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /api/auth/verify - Verify JWT token
router.post('/verify', (req: Request, res: Response): void => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
          permissions: decoded.permissions
        },
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
      return;
    }

    logger.error('Token verification error:', error);
    res.status(500).json({ success: false, error: 'Token verification failed' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', (req: Request, res: Response): void => {
  // This would typically use auth middleware to extract user from token
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'No valid token provided'
    });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });

  } catch (error) {
    logger.error('Get user info error:', error);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// POST /api/auth/logout - User logout
router.post('/logout', (req: Request, res: Response) => {
  // In a real application, you would handle session termination here
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
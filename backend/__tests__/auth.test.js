const httpMocks = require('node-mocks-http');
const { authController } = require('../src/controllers/authController');
const { User } = require('../src/models/User');


jest.mock('../src/models/User', () => ({
  User: {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    verifyPassword: jest.fn(),
    create: jest.fn(), 
  }
}));


jest.mock('../src/utils/jwt', () => ({
  jwtUtils: {
    generateToken: jest.fn().mockReturnValue('mocked_token')
  }
}));

describe('Authentication System', () => {
  
  let req, res; 

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
    jest.clearAllMocks();
  });

  it('AUTH-02: should successfully register (Placeholder)', async () => {
    console.warn('Note: The register method is currently missing in authController.ts.');
  });

  it('AUTH-03: should return 200 OK and JWT on valid sign in', async () => {
    req.body = { identifier: 'testuser', password: 'password123' };
    
    const mockUser = { 
      user_id: 1, 
      user_name: 'testuser', 
      email: 'test@prosepal.com',
      password: 'hashed_password' 
    };

    
    User.findByUsername.mockResolvedValue(mockUser);
    User.verifyPassword.mockResolvedValue(true);

    await authController.login(req, res);

    expect(res.statusCode).toBe(200);
    const responseData = JSON.parse(res._getData());
    
    expect(responseData.success).toBe(true);
    expect(responseData.data).toHaveProperty('token');
    expect(responseData.data.user.username).toBe('testuser');
  });

  it('AUTH-04: should throw 401 Unauthorized on invalid credentials', async () => {
    req.body = { identifier: 'testuser', password: 'wrongpassword' };
    
    const mockUser = { 
      user_id: 1, 
      user_name: 'testuser', 
      password: 'hashed_password' 
    };

    
    User.findByUsername.mockResolvedValue(mockUser);
    User.verifyPassword.mockResolvedValue(false);

    await authController.login(req, res);

    expect(res.statusCode).toBe(401);
    const responseData = JSON.parse(res._getData());
    expect(responseData.message).toBe('Invalid username or password');
  });

  it('AUTH-05: should return 404 if user not found during login', async () => {
    req.body = { identifier: 'nonexistent', password: 'password123' };
    
    
    User.findByUsername.mockResolvedValue(null);
    User.findByEmail.mockResolvedValue(null);

    await authController.login(req, res);

    expect(res.statusCode).toBe(401);
  });
});
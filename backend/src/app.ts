import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection, initDatabase } from './config/database'; 
import userRoutes from './routes/users'; 
import projectRoutes from './routes/projects';
import documentRoutes from './routes/documents'

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 数据库连接初始化
const initializeApp = async () => {
  try {
    // 测试数据库连接
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error('❌ 无法连接到数据库，请检查配置');
      process.exit(1);
    }

    // 初始化数据库表
    await initDatabase();
    console.log('✅ 数据库初始化完成');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 ProsePal Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`💾 Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    });

  } catch (error) {
    console.error('❌ 应用启动失败:', error);
    process.exit(1);
  }
};

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 注册路由
app.use('/api/users', userRoutes); // ✅ 添加用户路由
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);

// 健康检查路由
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      service: 'ProsePal Backend API',
      version: process.env.APP_VERSION || '1.0.0',
      database: {
        status: dbStatus ? 'connected' : 'disconnected',
        name: process.env.DB_NAME,
        host: process.env.DB_HOST
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      database: 'disconnected',
      error: '数据库连接失败'
    });
  }
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'ProsePal: An Intelligent Writing Assistant for Web Novel Authors', // [!code focus] // 使用项目完整标题
    version: '1.0.0',
    description: 'An integrated platform that enhances creative output, quality of works, and collaborative experience for online novel authors', // [!code focus] // 使用项目目标描述
    timestamp: new Date().toISOString(),
    features: [ // [!code focus] // 根据提案中的功能范围更新
      'Intelligent Document Management with version control',
      'Visual Chapter and Outline Management',
      'Integrated Research Environment with split-screen view',
      'NLP-powered Character Relationship Mapping',
      'Sentiment Analysis and Story Emotion Curve',
      'Consistency Checking for character traits',
      'Real-time Collaboration with role-based access',
      'AI-powered Writing Suggestions and Grammar Checking'
    ],
    developer: 'Hanna (202218020401)', // [!code focus] // 添加学生信息
    repository: 'https://github.com/jxlin0524/Web-application-project' // [!code focus] // 项目仓库
  });
});

// API文档端点
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'ProsePal Writing Assistant API', // [!code focus] // 更新API名称
    version: '1.0.0',
    description: 'Backend API for ProsePal - Intelligent writing assistant for web novel authors', // [!code focus] // 更新描述
    baseURL: `http://localhost:${PORT}/api`,
    endpoints: {
      authentication: {
        'POST /api/users/register': 'User registration',
        'POST /api/users/login': 'User login',
        'POST /api/users/logout': 'User logout',
        'GET /api/users/profile': 'Get user profile'
      },
      projects: { // [!code focus] // 项目管理相关端点
        'POST /api/projects': 'Create new writing project',
        'GET /api/projects': 'Get user projects list',
        'GET /api/projects/:id': 'Get specific project',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project',
        'POST /api/projects/:id/chapters': 'Add chapter to project',
        'PUT /api/projects/:id/chapters/:chapterId': 'Update chapter content'
      },
      writing_analysis: { // [!code focus] // 写作分析功能
        'POST /api/analysis/characters': 'Character relationship mapping',
        'POST /api/analysis/sentiment': 'Story sentiment analysis',
        'POST /api/analysis/consistency': 'Consistency checking',
        'POST /api/analysis/timeline': 'Plot timeline visualization'
      },
      collaboration: { // [!code focus] // 协作功能
        'POST /api/projects/:id/collaborators': 'Add collaborator',
        'PUT /api/projects/:id/collaborators/:userId': 'Update collaborator role',
        'POST /api/projects/:id/comments': 'Add comment',
        'POST /api/projects/:id/suggestions': 'Make suggestion'
      },
      ai_services: { // [!code focus] // AI服务集成
        'POST /api/ai/grammar-check': 'Grammar checking (Grammarly API)',
        'POST /api/ai/writing-suggestions': 'Writing suggestions (DeepSeek)',
        'POST /api/ai/text-analysis': 'Text analysis (spaCy/SnowNLP)',
        'POST /api/ai/plot-analysis': 'Plot analysis and visualization'
      },
      research: { // [!code focus] // 研究环境
        'POST /api/research/notes': 'Create research note',
        'GET /api/research/notes': 'Get research notes',
        'POST /api/research/clippings': 'Save web clipping'
      }
    },
    technologies: { // [!code focus] // 添加技术栈信息
      backend: 'Node.js + Express + TypeScript',
      database: 'MySQL',
      frontend: 'Vue.js + TypeScript',
      realtime: 'Socket.IO',
      ai_services: 'DeepSeek, spaCy, SnowNLP, Grammarly API',
      search: 'Elasticsearch'
    },
    contact: {
      student: 'Hanna (202218020401)',
      supervisor: 'Clivia'
    }
  });
});

// 项目信息端点（新增）
app.get('/api/project-info', (req, res) => {
  res.json({
    project_title: 'ProsePal: An Intelligent Writing Assistant for Web Novel Authors', // [!code focus]
    student_id: '202218020401', // [!code focus]
    supervisor: 'Clivia', // [!code focus]
    student_name: 'Hanna', // [!code focus]
    major: 'Software Engineering', // [!code focus]
    project_aim: 'Design and implement an integrated software that enhances creative output, quality of works, and collaborative experience for online novel authors', // [!code focus]
    core_features: [
      'Intelligent Document Management with cloud sync and version history',
      'Visual chapter management with drag-and-drop reorganization',
      'Integrated research environment with split-screen view',
      'NLP-powered character relationship mapping',
      'Sentiment analysis with story emotion curves',
      'Consistency checking for character traits',
      'Real-time collaboration with suggestion mode',
      'AI-powered writing assistance and grammar checking'
    ]
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    suggestion: 'Visit /api/docs for available API endpoints',
    documentation: 'https://github.com/jxlin0524/Web-application-project' // [!code focus]
  });
});

// 错误处理中间件
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Please contact the system administrator',
    requestId: req.headers['x-request-id'] || Date.now().toString(),
    support: 'Project repository: https://github.com/jxlin0524/Web-application-project' // [!code focus]
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 ProsePal Server running on port ${PORT}`); // [!code focus]
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`ℹ️  Project Info: http://localhost:${PORT}/api/project-info`);
  console.log(`🌟 ProsePal: An Intelligent Writing Assistant for Web Novel Authors`); // [!code focus]
  console.log(`👩‍💻 Developer: Hanna (202218020401), Supervisor: Clivia`); // [!code focus]
});

export default app;
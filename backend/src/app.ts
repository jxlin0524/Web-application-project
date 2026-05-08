import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection, initDatabase } from './config/database'; 
import userRoutes from './routes/users'; 
import projectRoutes from './routes/projects';
import documentRoutes from './routes/documents';
import aiRoutes from './routes/aiRoutes';
import shareRoutes from './routes/shareRoutes';
import path from 'path';


dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;


const initializeApp = async () => {
  try {
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.error(' Unable to connect to database, please check the configuration');
      process.exit(1);
    }

    
    await initDatabase();
    console.log(' Database initialization completed');

    
    app.listen(PORT, () => {
      console.log(` ProsePal Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(` API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(` Database: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    });

  } catch (error) {
    console.error(' Application startup failed:', error);
    process.exit(1);
  }
};


app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use('/api/users', userRoutes); 
app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/share', shareRoutes);

  
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));


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
      error: 'Database connection failed'
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'ProsePal: An Intelligent Writing Assistant for Web Novel Authors', 
    version: '1.0.0',
    description: 'An integrated platform that enhances creative output, quality of works, and collaborative experience for online novel authors', 
    timestamp: new Date().toISOString(),
    features: [ 
      'Intelligent Document Management with version control',
      'Visual Chapter and Outline Management',
      'Integrated Research Environment with split-screen view',
      'NLP-powered Character Relationship Mapping',
      'Sentiment Analysis and Story Emotion Curve',
      'Consistency Checking for character traits',
      'Real-time Collaboration with role-based access',
      'AI-powered Writing Suggestions and Grammar Checking'
    ],
    developer: 'Hanna (202218020401)', 
    repository: 'https://github.com/jxlin0524/Web-application-project' 
  });
});

app.get('/api/docs', (req, res) => {
  res.json({
    name: 'ProsePal Writing Assistant API', 
    version: '1.0.0',
    description: 'Backend API for ProsePal - Intelligent writing assistant for web novel authors', 
    baseURL: `http://localhost:${PORT}/api`,
    endpoints: {
      authentication: {
        'POST /api/users/register': 'User registration',
        'POST /api/users/login': 'User login',
        'POST /api/users/logout': 'User logout',
        'GET /api/users/profile': 'Get user profile'
      },
      projects: { 
        'POST /api/projects': 'Create new writing project',
        'GET /api/projects': 'Get user projects list',
        'GET /api/projects/:id': 'Get specific project',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project',
        'POST /api/projects/:id/chapters': 'Add chapter to project',
        'PUT /api/projects/:id/chapters/:chapterId': 'Update chapter content'
      },
      writing_analysis: { 
        'POST /api/analysis/characters': 'Character relationship mapping',
        'POST /api/analysis/sentiment': 'Story sentiment analysis',
        'POST /api/analysis/consistency': 'Consistency checking',
        'POST /api/analysis/timeline': 'Plot timeline visualization'
      },
      collaboration: { 
        'POST /api/projects/:id/collaborators': 'Add collaborator',
        'PUT /api/projects/:id/collaborators/:userId': 'Update collaborator role',
        'POST /api/projects/:id/comments': 'Add comment',
        'POST /api/projects/:id/suggestions': 'Make suggestion'
      },
      ai_services: { 
        'POST /api/ai/grammar-check': 'Grammar checking (Grammarly API)',
        'POST /api/ai/writing-suggestions': 'Writing suggestions (DeepSeek)',
        'POST /api/ai/text-analysis': 'Text analysis (spaCy/SnowNLP)',
        'POST /api/ai/plot-analysis': 'Plot analysis and visualization'
      },
      research: { 
        'POST /api/research/notes': 'Create research note',
        'GET /api/research/notes': 'Get research notes',
        'POST /api/research/clippings': 'Save web clipping'
      }
    },
    technologies: { 
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

app.get('/api/project-info', (req, res) => {
  res.json({
    project_title: 'ProsePal: An Intelligent Writing Assistant for Web Novel Authors', 
    student_id: '202218020401', 
    supervisor: 'Clivia', 
    student_name: 'Hanna', 
    major: 'Software Engineering', 
    project_aim: 'Design and implement an integrated software that enhances creative output, quality of works, and collaborative experience for online novel authors', 
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

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    suggestion: 'Visit /api/docs for available API endpoints',
    documentation: 'https://github.com/jxlin0524/Web-application-project' 
  });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Please contact the system administrator',
    requestId: req.headers['x-request-id'] || Date.now().toString(),
    support: 'Project repository: https://github.com/jxlin0524/Web-application-project' 
  });
});

app.listen(PORT, () => {
  console.log(` ProsePal Server running on port ${PORT}`); 
  console.log(` Environment: ${process.env.NODE_ENV}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(` Project Info: http://localhost:${PORT}/api/project-info`);
  console.log(` ProsePal: An Intelligent Writing Assistant for Web Novel Authors`); 
  console.log(` Developer: Hanna (202218020401), Supervisor: Clivia`); 
});

export default app;
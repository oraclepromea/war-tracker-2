# War Tracker 2.0 🎯

A real-time military conflict tracking system with AI-powered analysis, focusing on Middle East conflicts. Features a tactical HUD interface, live data aggregation from multiple sources, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Real-time Event Tracking** - Live updates from RSS feeds and news APIs
- **AI-Powered Analysis** - OpenRouter integration for event classification and threat assessment
- **Geographic Visualization** - Interactive maps with conflict heatmaps
- **Tactical Interface** - Military-style HUD with neon aesthetics
- **Multi-source Verification** - Cross-reference multiple news sources for credibility

### Data Sources
- Reuters Middle East Feed
- Associated Press World News
- BBC Middle East
- Times of Israel
- Haaretz
- Custom News API integration

### Technical Features
- **WebSocket Real-time Updates**
- **MongoDB Database** with optimized indexes
- **Redis Caching** for performance
- **Docker Containerization**
- **CI/CD Pipeline** with GitHub Actions
- **Security Scanning** with Trivy
- **Nginx Reverse Proxy** for production

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Three.js** for 3D weapon visualizations
- **Lucide React** for icons
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **WebSocket** for real-time communication
- **OpenRouter API** for AI analysis
- **JWT Authentication**
- **Rate Limiting** and security middleware

### Infrastructure
- **Docker** & **Docker Compose**
- **GitHub Actions** for CI/CD
- **Nginx** for reverse proxy
- **Redis** for caching
- **MongoDB** for data persistence

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- OpenRouter API key
- News API key (optional)

### Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/war-tracker-2.0.git
cd war-tracker-2.0
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Start with Docker Compose**
```bash
# Development mode
docker-compose --profile development up -d

# Production mode
docker-compose --profile production up -d
```

4. **Or run locally**
```bash
# Install dependencies
npm install
cd client && npm install
cd ../server && npm install

# Start MongoDB (if not using Docker)
mongod

# Start the server
cd server && npm run dev

# Start the client (in another terminal)
cd client && npm run dev
```

### Manual Setup

1. **Backend Setup**
```bash
cd server
npm install
npm run build
npm start
```

2. **Frontend Setup**
```bash
cd client
npm install
npm run build
npm run preview
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development|production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/war-tracker
REDIS_URL=redis://localhost:6379

# API Keys
OPENROUTER_API_KEY=your_openrouter_api_key
NEWS_API_KEY=your_news_api_key

# Authentication
JWT_SECRET=your-secret-key

# Data Aggregation
DATA_FETCH_INTERVAL=300000  # 5 minutes
AI_ANALYSIS_ENABLED=true
```

### Docker Configuration

The project includes production-ready Docker configuration:

- **Multi-stage builds** for optimized images
- **Non-root user** for security
- **Health checks** for container monitoring
- **Volume mounting** for persistent data

## 📡 API Endpoints

### Events
- `GET /api/events` - List events with filtering
- `GET /api/events/:id` - Get specific event
- `GET /api/events/analytics/summary` - Event analytics
- `GET /api/events/timeline/:period` - Timeline data

### Countries
- `GET /api/countries` - List countries with stats
- `GET /api/countries/:id` - Country details
- `GET /api/countries/:id/events` - Country-specific events

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/heatmap` - Geographic data
- `GET /api/analytics/trends` - Trend analysis

### AI Analysis
- `POST /api/ai/analyze` - Analyze text for events
- `GET /api/ai/threat-assessment` - Current threat level
- `POST /api/ai/verify` - Verify event credibility

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification
- `GET /api/auth/me` - Current user info

## 🎨 UI Components

### Main Interface
- **Navigation Tabs** - Dashboard, Events, Countries, Settings, Debug
- **Real-time Status Bar** - Connection status and live updates
- **Tactical Panels** - Military-style information displays

### Dashboard
- **Summary Tiles** - Key metrics with animations
- **Recent Events Feed** - Live event stream
- **War Overview** - Current conflict status
- **Activity Tracker** - Today's events and casualties

### Events Timeline
- **Filterable Event List** - Search and filter capabilities
- **Event Details Panel** - Comprehensive event information
- **Severity Indicators** - Color-coded threat levels
- **Source Verification** - Credibility scoring

### Countries & Forces
- **Country Cards** - Military data and statistics
- **Force Breakdown** - Air, naval, ground forces
- **Weapon Inventory** - 3D weapon visualizations
- **Casualty Tracking** - Real-time casualty data

## 🔒 Security Features

- **Rate Limiting** - Prevents API abuse
- **JWT Authentication** - Secure user sessions
- **Input Validation** - Prevents injection attacks
- **CORS Configuration** - Cross-origin protection
- **Helmet.js** - Security headers
- **Container Security** - Non-root user, minimal base image

## 📊 Data Flow

1. **Data Ingestion** - RSS feeds and APIs polled every 5 minutes
2. **AI Analysis** - OpenRouter processes articles for conflict relevance
3. **Verification** - Multi-source credibility scoring
4. **Storage** - Events stored in MongoDB with indexes
5. **Real-time Updates** - WebSocket broadcasts to connected clients
6. **Analytics** - Aggregated data for dashboard and insights

## 🔄 CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Testing** - Unit tests and linting
2. **Security Scanning** - Trivy vulnerability assessment
3. **Docker Build** - Multi-stage container builds
4. **Registry Push** - GitHub Container Registry
5. **Deployment** - Staging and production environments
6. **Notifications** - Slack alerts for deployment status

## 🚀 Deployment

### Docker Deployment
```bash
# Production deployment
docker-compose --profile production up -d

# View logs
docker-compose logs -f war-tracker

# Scale services
docker-compose up -d --scale war-tracker=3
```

### Manual Deployment
```bash
# Build for production
cd client && npm run build
cd ../server && npm run build

# Start production server
NODE_ENV=production npm start
```

## 🛡️ Default Credentials

For development/testing:
- **Username:** `admin` or `analyst`
- **Password:** `password`

⚠️ **Change these in production!**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is for educational and research purposes. The information provided should be verified through official sources before making any decisions.

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/war-tracker-2.0/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourusername/war-tracker-2.0/discussions)
- **Documentation:** [Wiki](https://github.com/yourusername/war-tracker-2.0/wiki)

---

**War Tracker 2.0** - Real-time conflict intelligence with AI-powered analysis 🎯
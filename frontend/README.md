# SILENT KILLER Frontend

Modern web interface for SILENT KILLER productivity monitoring system.

## Features

- **Real-time Dashboard**: Live activity monitoring and statistics
- **Productivity Suggestions**: AI-powered workflow optimization insights
- **Interactive Monitoring**: Start/stop activity tracking
- **System Resources**: CPU, memory, and event rate monitoring
- **Settings Panel**: Configure API, privacy, and monitoring preferences
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **React 18** - Modern UI framework
- **Vite** - Fast development server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Beautiful icons
- **Axios** - HTTP client

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- SILENT KILLER backend running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

```bash
# Start with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── Dashboard.jsx   # Main dashboard
│   │   ├── Suggestions.jsx # Suggestions panel
│   │   ├── MonitorPanel.jsx # Activity monitoring
│   │   └── SettingsPanel.jsx # Settings interface
│   ├── App.jsx            # Main application
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── package.json          # Dependencies
├── vite.config.js        # Vite configuration
└── tailwind.config.js    # Tailwind config
```

## Components

### Dashboard

- **Metrics Cards**: Real-time statistics (events, rate, uptime, CPU)
- **Activity Timeline**: Line chart showing events over time
- **Activity Distribution**: Pie chart of activity types
- **System Monitoring**: Real-time resource usage
- **Recent Events**: List of latest captured events

### Suggestions

- **Suggestion Cards**: Detailed productivity insights
- **Severity Filtering**: Filter by priority level
- **Action Buttons**: Accept/reject suggestions
- **Evidence Display**: Supporting data for each suggestion
- **Statistics**: Acceptance rates and confidence scores

### Monitor Panel

- **Control Panel**: Start/stop monitoring
- **Live Statistics**: Real-time event tracking
- **Event Stream**: Recent activity feed
- **Activity Log**: Detailed monitoring log
- **System Resources**: CPU and memory usage

### Settings Panel

- **API Configuration**: Backend connection settings
- **Monitoring Settings**: Enable/disable features
- **Privacy & Security**: Data protection options
- **Data & Storage**: Retention and export settings
- **System Status**: Connection health

## API Integration

The frontend communicates with the backend via REST API:

```javascript
// Health check
GET /api/health

// Get suggestions
GET /api/suggestions?user_id=default_user

// Record actions
POST /api/actions

// Ingest events
POST /api/ingest
```

## Styling

### Design System

- **Color Palette**: Dark theme with blue accents
- **Typography**: Clean, readable fonts
- **Glass Morphism**: Modern frosted glass effect
- **Animations**: Smooth transitions and micro-interactions

### Custom Components

```css
.glass-morphism {
  @apply bg-white/10 backdrop-blur-md border border-white/20 rounded-lg;
}

.neon-glow {
  @apply shadow-lg shadow-blue-500/50;
}

.pulse-animation {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws
```

### Proxy Configuration

Vite proxy handles API requests during development:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

## Performance

### Optimization

- **Code Splitting**: Automatic with Vite
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and font optimization
- **Caching**: Proper cache headers

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist
```

## Deployment

### Production Build

```bash
# Build optimized version
npm run build

# Preview locally
npm run preview
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Static Hosting

Deploy `dist/` folder to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3

## Troubleshooting

### Common Issues

**Backend Connection Error**
```bash
# Check if backend is running
curl http://localhost:8000/api/health

# Start backend
cd ../backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
npm run dev -- --port 3001
```

**Module Not Found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Development Tips

1. **Hot Reload**: Changes auto-refresh in browser
2. **Console Errors**: Check browser console for API errors
3. **Network Tab**: Monitor API requests and responses
4. **React DevTools**: Install for component debugging

## Contributing

1. Follow existing code style
2. Use TypeScript for new components
3. Add tests for new features
4. Update documentation

## License

MIT License - see LICENSE file for details.

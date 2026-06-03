# Frontend Setup & Configuration Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```
   
   The application will be available at `http://localhost:4200`

3. **Build for Production**
   ```bash
   npm run build:prod
   ```

## Environment Setup

### Development
- API URL: `http://localhost:5000/api`
- Port: `4200`
- Configured in `src/environments/environment.ts`

### Production
- Update API URL in `src/environments/environment.prod.ts`
- Build with: `npm run build:prod`

## Troubleshooting

### Port Already in Use
If port 4200 is already in use:
```bash
ng serve --port 4300
```

### Module Not Found
Make sure all dependencies are installed:
```bash
npm install
```

### Dark Mode Not Working
Ensure JavaScript is enabled and check browser console for errors.

## API Integration

The frontend connects to the backend at:
- **Default**: `http://localhost:5000/api`
- **Endpoints Used**:
  - `GET /api/properties` - List all properties
  - `POST /api/properties/search` - Search properties
  - `POST /api/valuation/estimate` - Get property valuation
  - `POST /api/properties/investment` - Calculate investment score

## Component Development

Each component follows this structure:
```
component-name/
├── component-name.component.ts
├── component-name.component.html
└── component-name.component.css
```

All components are:
- Typed with TypeScript
- Styled with Tailwind CSS
- Responsive and accessible
- Include error handling and loading states

## Available Scripts

- `npm start` - Development server
- `npm run build` - Development build
- `npm run build:prod` - Production build
- `npm test` - Run tests
- `npm run lint` - Run linter

## Performance Tips

1. **Production Build**
   ```bash
   npm run build:prod
   ```
   Includes optimization and minification

2. **Lazy Loading**
   Routes support lazy loading for better performance

3. **Change Detection**
   Components use OnPush change detection where applicable

## Support

For issues or questions, check:
1. Browser console for errors
2. Network tab for API calls
3. Component documentation in code comments

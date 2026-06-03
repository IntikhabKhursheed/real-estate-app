# EstateIQ Frontend

AI-powered real estate analysis frontend built with Angular 19, TypeScript, and Tailwind CSS.

## Features

✨ **Core Features**
- 🏠 Property Search with natural language AI queries
- 💰 Smart Property Valuation with confidence scores
- 📊 Investment Score Analysis with AI reasoning
- 🌙 Dark/Light mode toggle
- 📱 Fully responsive mobile-first design
- ♿ Accessible UI components

## Tech Stack

- **Framework**: Angular 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Angular Router
- **State Management**: RxJS
- **HTTP Client**: HttpClientModule
- **Forms**: Reactive Forms & Template Forms

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── navbar/
│   │   ├── footer/
│   │   ├── home/
│   │   ├── property-list/
│   │   ├── property-valuation/
│   │   ├── property-search/
│   │   └── investment-score/
│   ├── services/
│   │   ├── property.service.ts
│   │   ├── valuation.service.ts
│   │   └── investment.service.ts
│   ├── app.module.ts
│   ├── app-routing.module.ts
│   ├── app.component.ts
│   └── app.component.html
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
├── styles.css
├── main.ts
└── index.html
```

## Installation

1. **Install dependencies**
```bash
npm install
```

2. **Start development server**
```bash
npm start
# or
ng serve
```

3. **Build for production**
```bash
npm run build:prod
```

## Configuration

### API Endpoint
Update the API URL in `src/services/property.service.ts`, `src/services/valuation.service.ts`, and `src/services/investment.service.ts`:

```typescript
private apiUrl = 'http://localhost:5000/api';
```

Or use the environment files in `src/environments/`

## Components Overview

### Home Component
- Welcome hero section
- Featured properties showcase
- Quick navigation to key features

### Property List Component
- Display all available properties
- Sorting and filtering options
- Property cards with detailed information
- Links to investment score pages

### Property Valuation Component
- Interactive form for property details
- Amenities selection checkboxes
- Real-time valuation results
- Confidence score visualization
- Investment rating display

### Property Search Component
- Natural language search input
- AI-powered property recommendations
- Search result cards
- AI reasoning display
- Example search suggestions

### Investment Score Component
- Detailed property information
- Investment score visualization
- Confidence level indicator
- AI analysis and reasoning
- Key investment factors

### Navbar Component
- Responsive navigation menu
- Dark/Light mode toggle
- Mobile hamburger menu
- Active route highlighting

### Footer Component
- Contact information
- Quick links
- Copyright information

## Services

### PropertyService
- `getProperties()`: Fetch all properties
- `getPropertyById(id)`: Get specific property details
- `searchProperties(query)`: Search with natural language
- `createProperty(data)`: Create new property

### ValuationService
- `estimateProperty(data)`: Get property valuation estimate

### InvestmentService
- `calculateInvestment(propertyId)`: Calculate investment score

## Routing

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | HomeComponent | Home page with featured properties |
| `/properties` | PropertyListComponent | All properties listing |
| `/valuation` | PropertyValuationComponent | Property valuation form |
| `/search` | PropertySearchComponent | AI-powered search |
| `/investment/:id` | InvestmentScoreComponent | Investment analysis |

## Styling

The project uses **Tailwind CSS** for styling with:
- Dark mode support
- Responsive design
- Custom color scheme
- Utility-first approach

### Dark Mode
Dark mode is automatically enabled based on system preferences but can be manually toggled via the navbar button.

## Error Handling

All components include:
- Loading states with spinners
- Error messages with retry options
- Form validation with helpful feedback
- Network error handling

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimizations

- OnPush change detection
- Lazy loading routes
- Image optimization
- CSS tree-shaking with Tailwind
- Production builds with optimization flags

## Future Enhancements

- [ ] User authentication
- [ ] Favorites/Wishlist
- [ ] Property comparison
- [ ] Advanced filters
- [ ] Map integration
- [ ] Image gallery
- [ ] Reviews and ratings
- [ ] Contact form

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is part of the EstateIQ platform.

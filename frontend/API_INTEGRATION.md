# API Integration Guide

## Backend Integration

The EstateIQ Frontend communicates with the backend API running at `http://localhost:5000`.

## API Endpoints

### Properties
- **GET /api/properties**
  - Returns: Array of all properties
  - Response:
    ```json
    [
      {
        "_id": "string",
        "title": "string",
        "city": "string",
        "country": "string",
        "type": "string",
        "price": number,
        "bedrooms": number,
        "bathrooms": number,
        "area": number,
        "amenities": ["string"],
        "age": number
      }
    ]
    ```

- **POST /api/properties/search**
  - Body: `{ "query": "string" }`
  - Returns: Properties matching the query with AI reasoning
  - Response:
    ```json
    {
      "properties": [...],
      "reasoning": "string"
    }
    ```

### Valuation
- **POST /api/valuation/estimate**
  - Body:
    ```json
    {
      "city": "string",
      "country": "string",
      "type": "string",
      "bedrooms": number,
      "bathrooms": number,
      "area": number,
      "age": number,
      "amenities": ["string"]
    }
    ```
  - Response:
    ```json
    {
      "estimatedPrice": number,
      "confidence": number,
      "investmentRating": "string",
      "reasoning": "string"
    }
    ```

### Investment
- **POST /api/properties/investment**
  - Body: `{ "propertyId": "string" }`
  - Returns: Investment analysis
  - Response:
    ```json
    {
      "investmentScore": number,
      "confidence": number,
      "reasoning": "string",
      "recommendation": "string"
    }
    ```

## Error Handling

All services handle errors gracefully with:
- User-friendly error messages
- Retry options
- Network error detection
- API error responses

## CORS Configuration

Ensure your backend has CORS enabled for:
- `http://localhost:4200` (development)
- `http://localhost:3000` (alternative dev port)
- Your production domain

## Service Usage Examples

### PropertyService
```typescript
// Get all properties
this.propertyService.getProperties().subscribe(
  (properties) => console.log(properties),
  (error) => console.error(error)
);

// Search properties
this.propertyService.searchProperties('luxury apartments').subscribe(
  (results) => console.log(results),
  (error) => console.error(error)
);
```

### ValuationService
```typescript
const valuationData = {
  city: 'New York',
  country: 'USA',
  type: 'Apartment',
  bedrooms: 3,
  bathrooms: 2,
  area: 1500,
  age: 5,
  amenities: ['Pool', 'Gym']
};

this.valuationService.estimateProperty(valuationData).subscribe(
  (result) => console.log(result),
  (error) => console.error(error)
);
```

### InvestmentService
```typescript
this.investmentService.calculateInvestment('property-id').subscribe(
  (result) => console.log(result),
  (error) => console.error(error)
);
```

## Testing the Integration

1. **Start Backend**
   ```bash
   cd server
   npm start
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Test Endpoints**
   - Open DevTools (F12)
   - Go to Network tab
   - Navigate through the app
   - Check API calls for proper request/response

## Debugging

Enable logging in services:
```typescript
console.log('API Request:', url, data);
console.log('API Response:', response);
```

Check the Network tab in browser DevTools to see:
- Request/Response headers
- Request body
- Response body
- Status code
- Timing information

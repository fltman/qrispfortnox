# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Inköpsorder (Purchase Order) Extractor** tool that processes PDF purchase orders using AI and integrates with Fortnox accounting system. The application uses OpenAI Vision API to extract structured data from PDF documents, displays them in an editable form, and submits to Fortnox via their REST API.

## Common Development Commands

### Setup
```bash
npm install                 # Install all dependencies
cp .env.example .env        # Create environment file
```

### Development
```bash
npm run dev                 # Start both frontend (port 5173) and backend (port 3000)
npm run dev:client          # Start only Vite frontend
npm run dev:server          # Start only Express backend with hot reload (tsx watch)
```

### Build & Production
```bash
npm run build              # TypeScript compile + Vite build
npm run preview            # Preview production build
npm run lint               # Run ESLint
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, React PDF, React Hook Form
- **Backend**: Express + TypeScript, OpenAI API, Fortnox API v3, Multer
- **Build**: Vite for frontend, tsx for backend dev server

### Key Architectural Decisions

1. **Split-Screen Layout**: The UI is divided into two equal panels:
   - Left: PDF preview using `react-pdf`
   - Right: Editable form with extracted data

2. **Processing Flow**:
   ```
   PDF Upload → PDF Rasterization (pdftoppm) → PNG Image → OpenAI Vision OCR (GPT-4) → JSON Data → React Hook Form → Fortnox API
   ```

3. **API Proxy**: Vite proxies `/api/*` requests to Express server running on port 3000 (configured in `vite.config.ts:11`)

4. **File Uploads**: Multer stores PDFs temporarily in `uploads/` directory, which is cleaned up after processing

5. **Type Safety**: Shared TypeScript types between frontend and backend in `src/types.ts`:
   - `PurchaseOrder`: Main order data structure matching Fortnox schema
   - `PurchaseOrderLine`: Individual order rows
   - `ExtractedData`: Wrapper including confidence score

### Critical Files

- `server/index.ts:28-54` - Main API endpoints (`/api/extract` and `/api/fortnox/purchase-order`)
- `server/services/openai.ts:12-80` - OpenAI Vision integration with structured prompt
- `server/services/fortnox.ts:23-72` - Fortnox API client with data transformation
- `src/App.tsx:12-24` - Main workflow orchestration
- `src/components/PurchaseOrderForm.tsx` - Form with all editable fields

### Environment Variables Required

```bash
OPENAI_API_KEY              # OpenAI API key for GPT-4 Vision
FORTNOX_ACCESS_TOKEN        # Fortnox integration access token (requires OAuth scopes: article, warehouse)
FORTNOX_CLIENT_SECRET       # Fortnox client secret
PORT=3000                   # Backend server port (optional)
```

**Important**: The Fortnox access token must be obtained with the following OAuth scopes:
- `article` - Required to manage articles/products
- `warehouse` - Required to create purchase orders via the v3 API

To obtain a token with correct scopes, use: https://apps.fortnox.se/oauth-v1/auth

## Development Workflow

### Adding New Fields to Extract

1. Update TypeScript interfaces in `src/types.ts`
2. Modify OpenAI prompt in `server/services/openai.ts:20-48` to include new field
3. Add form field in `src/components/PurchaseOrderForm.tsx`
4. Update Fortnox transformation in `server/services/fortnox.ts:28-55`

### Testing OpenAI Extraction

The system prompt in `server/services/openai.ts:20` instructs GPT-4 Vision to:
- Extract data in Swedish
- Return JSON with specific structure
- Provide confidence score (0-1)
- Leave unclear fields empty

Test with sample PDFs to refine the prompt if extraction quality is poor.

### Testing Fortnox Integration

Use the helper function `testFortnoxConnection()` in `server/services/fortnox.ts:78-99` to verify credentials before sending actual orders.

### PDF Rasterization Process

**IMPORTANT**: The system converts PDFs to images before OCR, as specified by the user.

The PDF extraction workflow in `server/services/openai.ts:17-41`:
1. Uses `pdftoppm` (from poppler-utils) to rasterize PDF to PNG at 300 DPI
2. Only converts the first page (`-singlefile` flag)
3. Creates temporary PNG file in same directory as uploaded PDF
4. Sends PNG as base64 to OpenAI Vision API for OCR
5. Cleans up both PDF and PNG after processing

**System Requirements**:
- `poppler-utils` must be installed (provides `pdftoppm` command)
- On macOS: `brew install poppler` (likely already installed)
- On Ubuntu/Debian: `apt-get install poppler-utils`

If extraction quality is poor, try:
- Increasing DPI: Change `-r 300` to `-r 600` in `openai.ts:27`
- Processing multiple pages if needed
- Adjusting image preprocessing with Sharp library

## Common Issues

### react-pdf Worker Issues
The PDF viewer requires a worker. It's configured in `PDFViewer.tsx:6` using unpkg CDN:
```typescript
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
```

### CORS with Fortnox API
All Fortnox API calls go through the Express backend to avoid CORS issues and protect credentials. Never call Fortnox API directly from frontend.

### File Upload Size Limits
Multer is configured with 10MB limit in `server/index.ts:12`. Adjust if needed for larger PDFs.

## API Structure Notes

### Fortnox Purchase Order Schema
The Fortnox API expects specific field names (see their docs: https://api.fortnox.se/apidocs#tag/warehouse_PurchaseOrder). The transformation in `server/services/fortnox.ts:28-55` maps our internal schema to Fortnox's schema:
- `Phone` → `Phone1`
- Row-level fields must match exactly
- `Currency` defaults to "SEK" if not specified

### OpenAI Response Format
We use `response_format: { type: 'json_object' }` in `server/services/openai.ts:72` to ensure structured JSON output. This requires the system prompt to explicitly request JSON format.

## Deployment Considerations

- Upload folder (`uploads/`) should be writable by the server process
- Consider implementing file cleanup cron job for orphaned uploads
- Rate limiting recommended for both OpenAI and Fortnox API calls
- Store API keys securely (environment variables, secrets manager)
- Add authentication/authorization before production use

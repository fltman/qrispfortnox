# Inköpsorder Extractor

Ett verktyg för att automatiskt extrahera data från PDF-inköpsorder med hjälp av OpenAI Vision API och skicka dem till Fortnox.

## Funktioner

- **PDF Upload**: Drag-and-drop eller välj PDF-filer
- **AI-driven OCR**: Extraherar data automatiskt med OpenAI GPT-4 Vision
- **Split-view Layout**: PDF-preview till vänster, redigerbart formulär till höger
- **Fortnox Integration**: Skickar inköpsorder direkt till Fortnox API
- **Dataredigering**: Alla extraherade fält kan redigeras innan submit

## Teknisk Stack

### Frontend
- React 18 + TypeScript
- Vite för snabb development
- Tailwind CSS för styling
- React PDF för PDF-visning
- React Hook Form för formulärhantering

### Backend
- Express server
- OpenAI API (GPT-4 Vision)
- Fortnox API v3
- Multer för filuppladdning

## Installation

1. Klona projektet och installera dependencies:
```bash
npm install
```

2. Skapa en `.env` fil baserad på `.env.example`:
```bash
cp .env.example .env
```

3. Fyll i dina API-nycklar i `.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
FORTNOX_ACCESS_TOKEN=your_fortnox_access_token
FORTNOX_CLIENT_SECRET=your_fortnox_client_secret
PORT=3000
```

## Användning

### Development
Starta både frontend och backend i utvecklingsläge:
```bash
npm run dev
```

Detta startar:
- Vite dev server på http://localhost:5173
- Express API server på http://localhost:3000

### Endast Frontend
```bash
npm run dev:client
```

### Endast Backend
```bash
npm run dev:server
```

### Production Build
```bash
npm run build
npm run preview
```

## Fortnox API Setup

1. Logga in på Fortnox Developer Portal: https://developer.fortnox.se/
2. Skapa en ny integration
3. Få Access Token och Client Secret
4. Lägg till dem i `.env` filen

Dokumentation: https://api.fortnox.se/apidocs

## OpenAI API Setup

1. Gå till https://platform.openai.com/api-keys
2. Skapa en ny API-nyckel
3. Lägg till den i `.env` filen som `OPENAI_API_KEY`

## Workflow

1. Användaren drar och släpper en PDF-inköpsorder
2. PDF:en visas i vänster panel
3. Backend skickar PDF:en till OpenAI Vision API
4. OpenAI extraherar strukturerad data (leverantör, rader, etc.)
5. Data visas i redigerbart formulär i höger panel
6. Användaren kan justera data om nödvändigt
7. Vid submit skickas data till Fortnox via deras API

## Projektstruktur

```
inkopsorder/
├── src/                    # Frontend React app
│   ├── components/         # React komponenter
│   │   ├── PDFUploader.tsx
│   │   ├── PDFViewer.tsx
│   │   └── PurchaseOrderForm.tsx
│   ├── types.ts           # TypeScript typer
│   ├── App.tsx
│   └── main.tsx
├── server/                 # Backend Express server
│   ├── services/
│   │   ├── openai.ts      # OpenAI integration
│   │   └── fortnox.ts     # Fortnox API client
│   └── index.ts           # Express app
├── uploads/               # Temporary PDF storage
└── package.json
```

## API Endpoints

### `POST /api/extract`
Ladda upp PDF och extrahera data med OpenAI.

**Request**: multipart/form-data med `pdf` fil

**Response**:
```json
{
  "purchaseOrder": {
    "SupplierName": "...",
    "PurchaseOrderRows": [...]
  },
  "confidence": 0.95
}
```

### `POST /api/fortnox/purchase-order`
Skicka inköpsorder till Fortnox.

**Request**: JSON med purchase order data

**Response**:
```json
{
  "success": true,
  "data": {...},
  "message": "Purchase order created successfully"
}
```

## Troubleshooting

### PDF visas inte
- Kontrollera att `react-pdf` worker är korrekt konfigurerad
- Försök uppdatera browsern

### OpenAI extraction misslyckas
- Verifiera att `OPENAI_API_KEY` är korrekt i `.env`
- Kontrollera att du har tillgång till GPT-4 Vision API
- Kontrollera API-krediter

### Fortnox API error
- Verifiera credentials i `.env`
- Kontrollera att integrationens scope inkluderar `purchaseorder`
- Läs Fortnox API dokumentation för error codes

## License

ISC

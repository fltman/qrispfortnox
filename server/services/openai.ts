import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { ExtractedData } from '../../src/types.js'

const execAsync = promisify(exec)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Converts PDF to PNG image using pdf-poppler
 */
async function convertPDFToImage(pdfPath: string): Promise<string> {
  const outputDir = path.dirname(pdfPath)
  const baseName = path.basename(pdfPath, '.pdf')

  try {
    // Convert PDF to PNG using pdftoppm (from poppler-utils)
    // -png: output format
    // -singlefile: only convert first page
    // -r 300: resolution 300 DPI for better OCR
    await execAsync(
      `pdftoppm -png -singlefile -r 300 "${pdfPath}" "${outputDir}/${baseName}"`
    )

    const imagePath = `${outputDir}/${baseName}.png`

    // Verify image was created
    await fs.access(imagePath)

    console.log('PDF converted to image:', imagePath)
    return imagePath
  } catch (error) {
    console.error('Error converting PDF to image:', error)
    throw new Error('Failed to convert PDF to image. Make sure poppler-utils is installed.')
  }
}

export async function extractDataFromPDF(pdfPath: string): Promise<ExtractedData> {
  let imagePath: string | null = null

  try {
    // Step 1: Convert PDF to image (rasterize)
    console.log('Converting PDF to image...')
    imagePath = await convertPDFToImage(pdfPath)

    // Step 2: Read image and convert to base64
    const imageBuffer = await fs.readFile(imagePath)
    const base64Image = imageBuffer.toString('base64')

    console.log('Sending image to OpenAI Vision API for OCR...')

    // Step 3: Use OpenAI Vision API to extract data via OCR
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Du är en expert på att extrahera data från inköpsorder med OCR.
Analysera bilden av inköpsordern noggrant och extrahera all relevant information.
Returnera data i följande JSON-format:

{
  "purchaseOrder": {
    "supplierNumber": "Leverantörsnummer",
    "supplierName": "Leverantörens namn",
    "supplierAddress": "Leverantörens adress",
    "supplierCity": "Leverantörens stad",
    "supplierPostCode": "Leverantörens postnummer",
    "supplierCountryCode": "Landskod (SE, NO, etc)",
    "supplierEmail": "Leverantörens e-post",

    "deliveryName": "Leveransnamn/Mottagare",
    "deliveryAddress": "Leveransadress",
    "deliveryCity": "Leveransstad",
    "deliveryZipCode": "Leveranspostnummer",
    "deliveryCountryCode": "Landskod för leverans",
    "deliveryDate": "Leveransdatum (YYYY-MM-DD)",

    "orderDate": "Orderdatum (YYYY-MM-DD)",
    "currencyCode": "Valutakod (SEK, EUR, USD, etc)",
    "currencyRate": 1.0,
    "paymentTermsCode": "Betalningsvillkor (t.ex. 30, NET30, etc)",

    "ourReference": "Vår referens",
    "yourReference": "Er referens",
    "messageToSupplier": "Meddelande till leverantör",
    "note": "Intern anteckning",

    "rows": [
      {
        "itemId": "Artikelnummer/SKU (KRÄVS)",
        "itemDescription": "Beskrivning av artikeln",
        "orderedQuantity": 1,
        "itemUnit": "Enhet (st, kg, m, etc)",
        "price": 100.00,
        "currencyCode": "Valutakod (samma som huvudorder)"
      }
    ]
  },
  "confidence": 0.95
}

VIKTIGA REGLER:
- supplierNumber, deliveryName, deliveryAddress, deliveryCity, deliveryZipCode, orderDate, currencyCode, currencyRate och paymentTermsCode är OBLIGATORISKA
- För varje rad: itemId, orderedQuantity och currencyCode är OBLIGATORISKA
- Om orderDate saknas, använd dagens datum
- Om currencyCode saknas, använd "SEK"
- Om currencyRate saknas, använd 1.0
- Om paymentTermsCode saknas, använd "30" (30 dagars betalningsvillkor)
- Om deliveryName saknas, använd samma som supplierName
- Om leveransadress saknas, använd samma som leverantörens adress
- För varje rad, sätt currencyCode till samma som huvudordern
- Om något fält saknas eller är oklart, försök gissa rimligt eller lämna tomt
- Sätt confidence mellan 0 och 1 baserat på hur säker du är på extraheringen
- Var extra noggrann med att läsa alla siffror och text korrekt`
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    const extractedData = JSON.parse(content) as ExtractedData

    console.log('Data extracted successfully with confidence:', extractedData.confidence)

    // Clean up uploaded files
    await fs.unlink(pdfPath).catch(err => console.error('Error deleting PDF:', err))
    if (imagePath) {
      await fs.unlink(imagePath).catch(err => console.error('Error deleting image:', err))
    }

    return extractedData
  } catch (error) {
    console.error('Error in extractDataFromPDF:', error)

    // Clean up files on error
    await fs.unlink(pdfPath).catch(() => {})
    if (imagePath) {
      await fs.unlink(imagePath).catch(() => {})
    }

    throw error
  }
}

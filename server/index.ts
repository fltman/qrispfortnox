import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv'
import axios from 'axios'
import { extractDataFromPDF } from './services/openai.js'
import { createPurchaseOrder } from './services/fortnox.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  }
})

app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Extract data from PDF using OpenAI
app.post('/api/extract', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' })
    }

    console.log('Processing PDF:', req.file.filename)

    const extractedData = await extractDataFromPDF(req.file.path)

    res.json(extractedData)
  } catch (error) {
    console.error('Error extracting data:', error)
    res.status(500).json({
      error: 'Failed to extract data from PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Send purchase order to Fortnox using official v3 API
app.post('/api/fortnox/purchase-order', async (req, res) => {
  try {
    const purchaseOrderData = req.body

    if (!purchaseOrderData) {
      return res.status(400).json({ error: 'No purchase order data provided' })
    }

    console.log('Creating purchase order in Fortnox using official v3 API...')

    // Get Fortnox credentials from headers or fall back to env
    const accessToken = req.headers['x-fortnox-access-token'] as string | undefined
    const clientSecret = req.headers['x-fortnox-client-secret'] as string | undefined

    const result = await createPurchaseOrder(purchaseOrderData, accessToken, clientSecret)
    res.json(result)
  } catch (error) {
    console.error('Error creating purchase order:', error)
    res.status(500).json({
      error: 'Failed to create purchase order in Fortnox',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Exchange authorization code for access token
app.post('/api/fortnox/oauth/token', async (req, res) => {
  try {
    const { code, clientId, clientSecret, redirectUri } = req.body

    if (!code || !clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['code', 'clientId', 'clientSecret', 'redirectUri']
      })
    }

    console.log('Exchanging authorization code for access token...')

    // Create Basic Auth credentials
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    // Request access token from Fortnox
    const response = await axios.post(
      'https://apps.fortnox.se/oauth-v1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    )

    console.log('Successfully obtained access token')
    console.log('Token details:')
    console.log('- Scopes received:', response.data.scope)
    console.log('- Expires in:', response.data.expires_in, 'seconds')
    console.log('- Token preview:', response.data.access_token?.substring(0, 20) + '...')

    res.json({
      success: true,
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in,
      scope: response.data.scope
    })
  } catch (error) {
    console.error('OAuth token exchange error:', error)

    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data
      return res.status(error.response?.status || 500).json({
        error: 'Failed to exchange authorization code',
        details: errorData?.error_description || errorData?.error || error.message
      })
    }

    res.status(500).json({
      error: 'Failed to exchange authorization code',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`API available at http://localhost:${PORT}/api`)
})

import axios from 'axios'
import { PurchaseOrder } from '../../src/types.js'

const FORTNOX_API_BASE = 'https://api.fortnox.se/3'

interface FortnoxConfig {
  accessToken: string
  clientSecret: string
}

function getFortnoxConfig(
  accessToken?: string,
  clientSecret?: string
): FortnoxConfig {
  const token = accessToken || process.env.FORTNOX_ACCESS_TOKEN
  const secret = clientSecret || process.env.FORTNOX_CLIENT_SECRET

  // Log which token source is being used
  if (accessToken) {
    console.log('Using access token from request headers (OAuth)')
  } else if (process.env.FORTNOX_ACCESS_TOKEN) {
    console.log('⚠️ WARNING: Using access token from .env file (may be outdated)')
  }

  if (!token || !secret) {
    throw new Error('Fortnox credentials not configured. Please provide credentials or set FORTNOX_ACCESS_TOKEN and FORTNOX_CLIENT_SECRET in .env file')
  }

  return { accessToken: token, clientSecret: secret }
}

/**
 * Create a purchase order in Fortnox using the official v3 API
 *
 * @requires OAuth scopes: article, warehouse
 * @see https://apps.fortnox.se/apidocs#tag/warehouse_PurchaseOrder/operation/1_create_11
 */
export async function createPurchaseOrder(
  orderData: PurchaseOrder,
  accessToken?: string,
  clientSecret?: string
) {
  try {
    const config = getFortnoxConfig(accessToken, clientSecret)

    // Transform data to Fortnox Warehouse API format (camelCase)
    const fortnoxData = {
      // Required fields
      supplierNumber: orderData.supplierNumber,
      deliveryName: orderData.deliveryName || 'Leverans',
      deliveryAddress: orderData.deliveryAddress,
      deliveryCity: orderData.deliveryCity,
      deliveryZipCode: orderData.deliveryZipCode,
      orderDate: orderData.orderDate,
      currencyCode: orderData.currencyCode || 'SEK',
      currencyRate: orderData.currencyRate || 1,
      paymentTermsCode: orderData.paymentTermsCode || '30',

      // Optional fields
      deliveryCountryCode: orderData.deliveryCountryCode,
      deliveryDate: orderData.deliveryDate,
      ourReference: orderData.ourReference,
      yourReference: orderData.yourReference,
      messageToSupplier: orderData.messageToSupplier || orderData.note,
      costCenterCode: orderData.costCenterCode,
      projectId: orderData.projectId,
      stockPointCode: orderData.stockPointCode,

      // Rows
      rows: orderData.rows.map(row => ({
        itemId: row.itemId,
        orderedQuantity: row.orderedQuantity,
        price: row.price || 0,
        itemUnit: row.itemUnit
      }))
    }

    console.log('Sending to Fortnox Warehouse API:', JSON.stringify(fortnoxData, null, 2))

    const response = await axios.post(
      `https://api.fortnox.se/api/warehouse/purchaseorders-v1`,
      fortnoxData,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Client-Secret': config.clientSecret,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    )

    return {
      success: true,
      data: response.data,
      message: 'Purchase order created successfully in Fortnox'
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data
      console.error('Fortnox API Error:', JSON.stringify(errorData, null, 2))

      throw new Error(
        `Failed to create purchase order: ${errorData?.ErrorInformation?.Message || errorData?.message || error.message}`
      )
    }
    throw error
  }
}

// Helper function to test Fortnox connection
export async function testFortnoxConnection(
  accessToken?: string,
  clientSecret?: string
) {
  try {
    const config = getFortnoxConfig(accessToken, clientSecret)

    const response = await axios.get(
      `${FORTNOX_API_BASE}/companyinformation`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Client-Secret': config.clientSecret,
          'Accept': 'application/json'
        }
      }
    )

    return {
      success: true,
      companyName: response.data.CompanyInformation?.CompanyName,
      message: 'Successfully connected to Fortnox'
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Fortnox connection failed: ${error.response?.data?.ErrorInformation?.Message || error.message}`
      )
    }
    throw error
  }
}

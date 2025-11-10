export interface PurchaseOrderRow {
  itemId: string; // Required - article number/SKU
  itemDescription?: string;
  orderedQuantity: number; // Required
  remainingOrderedQuantity?: number; // Required, but can default to orderedQuantity
  price?: number;
  itemUnit?: string;
  currencyCode: string; // Required on each row
  costCenterCode?: string;
  projectId?: string;
  stockPointCode?: string;
}

export interface PurchaseOrder {
  // Supplier information
  supplierNumber: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierAddress2?: string;
  supplierCity?: string;
  supplierPostCode?: string;
  supplierCountryCode?: string;
  supplierEmail?: string;

  // Delivery information
  deliveryName: string;
  deliveryAddress: string;
  deliveryAddress2?: string;
  deliveryCity: string;
  deliveryZipCode: string;
  deliveryCountryCode?: string;
  deliveryDate?: string;

  // Order information
  orderDate: string;
  currencyCode: string;
  currencyRate: number;
  currencyUnit?: number;
  paymentTermsCode: string;

  // References
  ourReference?: string;
  yourReference?: string;
  internalReference?: string;

  // Additional fields
  messageToSupplier?: string;
  note?: string;
  confirmationEmail?: string;
  costCenterCode?: string;
  projectId?: string;
  stockPointCode?: string;
  languageCode?: string;

  // Rows
  rows: PurchaseOrderRow[];
}

export interface ExtractedData {
  purchaseOrder: PurchaseOrder;
  confidence: number;
}

export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'error' | 'exported'

export interface QueueItem {
  id: string;
  file: File;
  fileName: string;
  status: QueueItemStatus;
  extractedData?: ExtractedData;
  error?: string;
  addedAt: Date;
  processedAt?: Date;
  exportedAt?: Date;
}

import { useState, useEffect, useCallback } from 'react'
import PDFUploader from './components/PDFUploader'
import PDFViewer from './components/PDFViewer'
import PurchaseOrderForm from './components/PurchaseOrderForm'
import QueueManager from './components/QueueManager'
import Settings, { getApiKeys, hasApiKeys } from './components/Settings'
import OAuthCallback from './components/OAuthCallback'
import { QueueItem } from './types'

function App() {
  // Check if this is an OAuth callback
  const isOAuthCallback = window.location.pathname === '/oauth-callback' ||
                          window.location.search.includes('code=')

  const [queue, setQueue] = useState<QueueItem[]>([])
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [showApiWarning, setShowApiWarning] = useState(!hasApiKeys())

  // If OAuth callback, show callback component
  if (isOAuthCallback) {
    return <OAuthCallback onComplete={() => window.location.href = '/'} />
  }

  // Process queue automatically
  useEffect(() => {
    const pendingItem = queue.find(item => item.status === 'pending')
    if (!pendingItem) return

    const processItem = async () => {
      // Update status to processing
      setQueue(prev =>
        prev.map(item =>
          item.id === pendingItem.id
            ? { ...item, status: 'processing' }
            : item
        )
      )

      try {
        const formData = new FormData()
        formData.append('pdf', pendingItem.file)

        const response = await fetch('/api/extract', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Failed to extract data')
        }

        const data = await response.json()

        // Update with extracted data
        setQueue(prev =>
          prev.map(item =>
            item.id === pendingItem.id
              ? {
                  ...item,
                  status: 'completed',
                  extractedData: data,
                  processedAt: new Date()
                }
              : item
          )
        )
      } catch (error) {
        console.error('Error extracting data:', error)
        setQueue(prev =>
          prev.map(item =>
            item.id === pendingItem.id
              ? {
                  ...item,
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              : item
          )
        )
      }
    }

    processItem()
  }, [queue])

  const handleFilesUpload = useCallback((files: File[]) => {
    const newItems: QueueItem[] = files.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      fileName: file.name,
      status: 'pending',
      addedAt: new Date()
    }))

    setQueue(prev => [...prev, ...newItems])
  }, [])

  const handleSelectItem = useCallback((item: QueueItem) => {
    setSelectedItem(item)
  }, [])

  const handleRemoveItem = useCallback((id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id))
    if (selectedItem?.id === id) {
      setSelectedItem(null)
    }
  }, [selectedItem])

  const handleExportAll = useCallback(async () => {
    const completedItems = queue.filter(item => item.status === 'completed')

    if (completedItems.length === 0) {
      alert('Inga klara ordrar att exportera')
      return
    }

    const confirmExport = window.confirm(
      `Exportera ${completedItems.length} inköpsorder till Fortnox?`
    )

    if (!confirmExport) return

    let successCount = 0
    let errorCount = 0

    const apiKeys = getApiKeys()

    for (const item of completedItems) {
      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }

        if (apiKeys?.fortnoxAccessToken) {
          headers['X-Fortnox-Access-Token'] = apiKeys.fortnoxAccessToken
        }
        if (apiKeys?.fortnoxClientSecret) {
          headers['X-Fortnox-Client-Secret'] = apiKeys.fortnoxClientSecret
        }

        const response = await fetch('/api/fortnox/purchase-order', {
          method: 'POST',
          headers,
          body: JSON.stringify(item.extractedData?.purchaseOrder)
        })

        if (!response.ok) {
          throw new Error('Failed to submit to Fortnox')
        }

        // Mark as exported
        setQueue(prev =>
          prev.map(qItem =>
            qItem.id === item.id
              ? { ...qItem, status: 'exported', exportedAt: new Date() }
              : qItem
          )
        )

        successCount++
      } catch (error) {
        console.error('Error exporting item:', error)
        errorCount++

        // Mark as error
        setQueue(prev =>
          prev.map(qItem =>
            qItem.id === item.id
              ? {
                  ...qItem,
                  status: 'error',
                  error: `Export misslyckades: ${error instanceof Error ? error.message : 'Unknown error'}`
                }
              : qItem
          )
        )
      }
    }

    alert(
      `Export klar!\n✓ Lyckade: ${successCount}\n✗ Misslyckade: ${errorCount}`
    )
  }, [queue])

  const handleUpdateOrder = useCallback((id: string, data: any) => {
    setQueue(prev =>
      prev.map(item =>
        item.id === id && item.extractedData
          ? {
              ...item,
              extractedData: {
                ...item.extractedData,
                purchaseOrder: data
              }
            }
          : item
      )
    )
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inköpsorder Extractor
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Ladda upp PDF-inköpsorder och exportera till Fortnox
              </p>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Inställningar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {showApiWarning && (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Fortnox API-nycklar krävs
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Du behöver konfigurera dina Fortnox API-nycklar innan du kan exportera ordrar.
                </p>
                <button
                  onClick={() => {
                    setSettingsOpen(true)
                    setShowApiWarning(false)
                  }}
                  className="mt-2 text-sm text-yellow-800 font-medium hover:underline"
                >
                  Öppna inställningar →
                </button>
              </div>
              <button
                onClick={() => setShowApiWarning(false)}
                className="ml-3 text-yellow-600 hover:text-yellow-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload area - always visible */}
        <div className="mb-6">
          <PDFUploader onFilesUpload={handleFilesUpload} />
        </div>

        {queue.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Queue Manager */}
            <div className="lg:col-span-1">
              <QueueManager
                queue={queue}
                onSelectItem={handleSelectItem}
                selectedItemId={selectedItem?.id}
                onRemoveItem={handleRemoveItem}
                onExportAll={handleExportAll}
              />
            </div>

            {/* Middle & Right: Selected Item Details */}
            {selectedItem && selectedItem.extractedData ? (
              <>
                <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      PDF Förhandsvisning
                    </h2>
                  </div>
                  <PDFViewer file={selectedItem.file} />
                </div>

                <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Extraherad Data
                  </h2>
                  <PurchaseOrderForm
                    data={selectedItem.extractedData}
                    itemId={selectedItem.id}
                    onUpdate={handleUpdateOrder}
                  />
                </div>
              </>
            ) : (
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">
                  Välj en klar order från kön för att visa detaljer
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App

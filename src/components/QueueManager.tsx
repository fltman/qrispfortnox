import { QueueItem } from '../types'

interface QueueManagerProps {
  queue: QueueItem[]
  onSelectItem: (item: QueueItem) => void
  selectedItemId?: string
  onRemoveItem: (id: string) => void
  onExportAll: () => void
}

export default function QueueManager({
  queue,
  onSelectItem,
  selectedItemId,
  onRemoveItem,
  onExportAll
}: QueueManagerProps) {
  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700'
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'exported':
        return 'bg-purple-100 text-purple-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: QueueItem['status']) => {
    switch (status) {
      case 'pending':
        return 'Väntar'
      case 'processing':
        return 'Bearbetar...'
      case 'completed':
        return 'Klar'
      case 'exported':
        return 'Exporterad'
      case 'error':
        return 'Fel'
      default:
        return status
    }
  }

  const completedCount = queue.filter(item => item.status === 'completed').length
  const exportedCount = queue.filter(item => item.status === 'exported').length
  const errorCount = queue.filter(item => item.status === 'error').length

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Kö ({queue.length} order{queue.length !== 1 ? 'ar' : ''})
        </h2>
        {completedCount > 0 && (
          <button
            onClick={onExportAll}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Exportera alla ({completedCount}) till Fortnox
          </button>
        )}
      </div>

      {queue.length > 0 && (
        <div className="mb-3 flex gap-4 text-sm text-gray-600">
          <span>✓ Klara: {completedCount}</span>
          <span>📤 Exporterade: {exportedCount}</span>
          {errorCount > 0 && <span>❌ Fel: {errorCount}</span>}
        </div>
      )}

      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {queue.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Ingen kö. Ladda upp PDF-filer för att komma igång.
          </p>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              onClick={() => item.status === 'completed' && onSelectItem(item)}
              className={`p-3 border rounded-lg transition-all cursor-pointer ${
                selectedItemId === item.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${item.status === 'completed' ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.fileName}
                    </p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </div>

                  {item.extractedData && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.extractedData.purchaseOrder.supplierName || 'Okänd leverantör'} •
                      {item.extractedData.purchaseOrder.rows?.length || 0} rad{item.extractedData.purchaseOrder.rows?.length !== 1 ? 'er' : ''}
                    </p>
                  )}

                  {item.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {item.error}
                    </p>
                  )}

                  {item.extractedData && item.extractedData.confidence < 0.8 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ Låg konfidens ({Math.round(item.extractedData.confidence * 100)}%)
                    </p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveItem(item.id)
                  }}
                  className="ml-3 text-gray-400 hover:text-red-600 transition-colors"
                  title="Ta bort från kö"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

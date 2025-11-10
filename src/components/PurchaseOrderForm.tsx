import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ExtractedData, PurchaseOrder } from '../types'

interface PurchaseOrderFormProps {
  data: ExtractedData
  itemId?: string
  onUpdate?: (id: string, data: PurchaseOrder) => void
}

export default function PurchaseOrderForm({ data, itemId, onUpdate }: PurchaseOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { register, handleSubmit, formState: { errors } } = useForm<PurchaseOrder>({
    defaultValues: data.purchaseOrder
  })

  const onSubmit = async (formData: PurchaseOrder) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    // Ensure each row has currencyCode and remainingOrderedQuantity
    const enrichedData = {
      ...formData,
      rows: formData.rows.map(row => ({
        ...row,
        currencyCode: row.currencyCode || formData.currencyCode,
        remainingOrderedQuantity: row.remainingOrderedQuantity || row.orderedQuantity
      }))
    }

    try {
      const response = await fetch('/api/fortnox/purchase-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrichedData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit to Fortnox')
      }

      setSubmitStatus('success')

      // Update parent state if callback provided
      if (itemId && onUpdate) {
        onUpdate(itemId, formData)
      }

      alert('Inköpsorder skickad till Fortnox!')
    } catch (error) {
      console.error('Error submitting to Fortnox:', error)
      setSubmitStatus('error')
      alert('Kunde inte skicka till Fortnox. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
      {data.confidence < 0.8 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Låg konfidens ({Math.round(data.confidence * 100)}%). Vänligen kontrollera all data noggrant.
          </p>
        </div>
      )}

      {/* Supplier Information */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-900 border-b pb-2">
          Leverantörsinformation
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leverantörsnummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('supplierNumber', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.supplierNumber && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt fält</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leverantörsnamn
            </label>
            <input
              type="text"
              {...register('supplierName')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adress
          </label>
          <input
            type="text"
            {...register('supplierAddress')}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postnummer
            </label>
            <input
              type="text"
              {...register('supplierPostCode')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stad
            </label>
            <input
              type="text"
              {...register('supplierCity')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landskod
            </label>
            <input
              type="text"
              {...register('supplierCountryCode')}
              placeholder="SE"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-900 border-b pb-2">
          Leveransinformation
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mottagare <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('deliveryName', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.deliveryName && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt fält</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leveransdatum
            </label>
            <input
              type="date"
              {...register('deliveryDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Leveransadress <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('deliveryAddress', { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.deliveryAddress && (
            <p className="text-xs text-red-600 mt-1">Obligatoriskt fält</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postnummer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('deliveryZipCode', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.deliveryZipCode && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stad <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('deliveryCity', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.deliveryCity && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Landskod
            </label>
            <input
              type="text"
              {...register('deliveryCountryCode')}
              placeholder="SE"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Order Information */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-900 border-b pb-2">
          Orderinformation
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Orderdatum <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('orderDate', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.orderDate && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt fält</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Betalningsvillkor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('paymentTermsCode', { required: true })}
              placeholder="30"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.paymentTermsCode && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt fält</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valuta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('currencyCode', { required: true })}
              placeholder="SEK"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.currencyCode && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valutakurs <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.0001"
              {...register('currencyRate', { required: true, valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.currencyRate && (
              <p className="text-xs text-red-600 mt-1">Obligatoriskt</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valutaenhet
            </label>
            <input
              type="number"
              {...register('currencyUnit', { valueAsNumber: true })}
              placeholder="1"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vår referens
            </label>
            <input
              type="text"
              {...register('ourReference')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Er referens
            </label>
            <input
              type="text"
              {...register('yourReference')}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meddelande till leverantör
          </label>
          <textarea
            {...register('messageToSupplier')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Order Rows */}
      <div className="space-y-4">
        <h3 className="text-md font-semibold text-gray-900 border-b pb-2">
          Orderrader
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Artikel ID *
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Beskrivning
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Antal *
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Enhet
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Pris
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.purchaseOrder.rows?.map((row, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      {...register(`rows.${index}.itemId` as const, { required: true })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="SKU/Artikelnr"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      {...register(`rows.${index}.itemDescription` as const)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`rows.${index}.orderedQuantity` as const, { required: true, valueAsNumber: true })}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      {...register(`rows.${index}.itemUnit` as const)}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                      placeholder="st"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`rows.${index}.price` as const, { valueAsNumber: true })}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4 border-t sticky bottom-0 bg-white pb-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          Avbryt
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Skickar...' : 'Skicka till Fortnox'}
        </button>
      </div>

      {submitStatus === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <p className="text-sm text-green-800">
            ✓ Inköpsorder skickad till Fortnox!
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm text-red-800">
            ✗ Kunde inte skicka till Fortnox. Försök igen.
          </p>
        </div>
      )}
    </form>
  )
}

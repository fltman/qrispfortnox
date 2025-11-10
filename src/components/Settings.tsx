import { useState, useEffect } from 'react'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

interface ApiKeys {
  fortnoxClientId: string
  fortnoxClientSecret: string
  fortnoxAccessToken: string
  fortnoxRedirectUri: string
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [keys, setKeys] = useState<ApiKeys>({
    fortnoxClientId: '',
    fortnoxClientSecret: '',
    fortnoxAccessToken: '',
    fortnoxRedirectUri: window.location.origin + '/oauth-callback'
  })
  const [showKeys, setShowKeys] = useState(false)
  const [saved, setSaved] = useState(false)
  const [authorizing, setAuthorizing] = useState(false)

  useEffect(() => {
    // Load keys from localStorage whenever dialog opens
    if (isOpen) {
      const savedKeys = localStorage.getItem('apiKeys')
      if (savedKeys) {
        setKeys(JSON.parse(savedKeys))
      }
    }
  }, [isOpen])

  const handleSave = () => {
    localStorage.setItem('apiKeys', JSON.stringify(keys))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClear = () => {
    if (window.confirm('Är du säker på att du vill radera alla API-nycklar?')) {
      setKeys({
        fortnoxClientId: '',
        fortnoxClientSecret: '',
        fortnoxAccessToken: '',
        fortnoxRedirectUri: window.location.origin + '/oauth-callback'
      })
      localStorage.removeItem('apiKeys')
    }
  }

  const handleAuthorize = () => {
    if (!keys.fortnoxClientId) {
      alert('Du måste ange Client ID först!')
      return
    }

    // Save current keys before redirecting
    localStorage.setItem('apiKeys', JSON.stringify(keys))

    // Build Fortnox authorization URL
    const authUrl = new URL('https://apps.fortnox.se/oauth-v1/auth')
    authUrl.searchParams.append('client_id', keys.fortnoxClientId)
    authUrl.searchParams.append('redirect_uri', keys.fortnoxRedirectUri)
    // Request scopes needed for purchase orders (as per Fortnox support)
    const scopes = [
      'companyinformation',  // Company information
      'article',             // Articles/products (REQUIRED by Fortnox support)
      'warehouse',           // Warehouse/Purchase orders (REQUIRED by Fortnox support)
      'supplier',            // Suppliers
    ]
    authUrl.searchParams.append('scope', scopes.join(' '))
    authUrl.searchParams.append('state', Math.random().toString(36).substring(7))
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('access_type', 'offline') // Request refresh token

    // Log the URL for debugging (without sensitive data in production)
    console.log('Redirecting to Fortnox authorization URL')
    console.log('Client ID:', keys.fortnoxClientId)
    console.log('Redirect URI:', keys.fortnoxRedirectUri)
    console.log('Requested scopes:', scopes.join(', '))
    console.log('Full URL:', authUrl.toString())

    // Redirect to Fortnox
    window.location.href = authUrl.toString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Inställningar</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* OAuth Setup Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">OAuth-konfiguration</h3>

              {/* Client ID */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client ID
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Din Fortnox integration Client ID.
                  <a
                    href="https://developer.fortnox.se/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Fortnox Developer Portal →
                  </a>
                </p>
                <input
                  type="text"
                  value={keys.fortnoxClientId}
                  onChange={(e) => setKeys({ ...keys, fortnoxClientId: e.target.value })}
                  placeholder="Client ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Client Secret */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Secret
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Din Fortnox integration Client Secret.
                </p>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={keys.fortnoxClientSecret}
                  onChange={(e) => setKeys({ ...keys, fortnoxClientSecret: e.target.value })}
                  placeholder="Client Secret"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Redirect URI */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Redirect URI
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Använd denna URL i din Fortnox integration-inställningar.
                </p>
                <input
                  type="text"
                  value={keys.fortnoxRedirectUri}
                  onChange={(e) => setKeys({ ...keys, fortnoxRedirectUri: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Authorize Button */}
              <button
                onClick={handleAuthorize}
                disabled={!keys.fortnoxClientId || authorizing}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {authorizing ? 'Auktoriserar...' : 'Auktorisera med Fortnox'}
              </button>
            </div>

            {/* Access Token Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Access Token</h3>
                {keys.fortnoxAccessToken && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Auktoriserad
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Vill du ta bort den nuvarande access token och auktorisera på nytt?\n\nDetta är nödvändigt om du har ändrat scopes i Developer Portal.')) {
                          const updatedKeys = { ...keys, fortnoxAccessToken: '' }
                          setKeys(updatedKeys)
                          localStorage.setItem('apiKeys', JSON.stringify(updatedKeys))
                        }
                      }}
                      className="text-xs text-red-600 hover:underline"
                      title="Återauktorisera med nya scopes"
                    >
                      Återauktorisera
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fortnox Access Token
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Genereras automatiskt efter auktorisering, eller klistra in manuellt.
                </p>
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={keys.fortnoxAccessToken}
                  onChange={(e) => setKeys({ ...keys, fortnoxAccessToken: e.target.value })}
                  placeholder="Genereras efter auktorisering"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Toggle visibility */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showKeys"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showKeys" className="ml-2 text-sm text-gray-700">
                Visa API-nycklar
              </label>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Viktigt att konfigurera i Fortnox Developer Portal</h3>
                  <div className="mt-2 text-sm text-blue-700 space-y-2">
                    <p>Innan du auktoriserar, se till att:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Du har skapat en integration i Fortnox Developer Portal</li>
                      <li>Redirect URI ovan är <strong>exakt samma</strong> som i din Fortnox integration</li>
                      <li>Din integration har följande scopes aktiverade (enligt Fortnox support):
                        <ul className="list-disc ml-4 mt-1">
                          <li><strong>article (med Write-behörighet - KRÄVS)</strong></li>
                          <li><strong>warehouse (med Write-behörighet - KRÄVS för purchase orders)</strong></li>
                          <li>companyinformation (rekommenderas)</li>
                          <li>supplier (rekommenderas)</li>
                        </ul>
                      </li>
                      <li><strong>KRITISKT</strong>: I Developer Portal, aktivera <strong>"Write"-checkbox</strong> för både <code>article</code> och <code>warehouse</code> scopes</li>
                      <li>Efter att ha aktiverat scopes/Write-behörighet, <strong>måste du auktorisera på nytt</strong> för att få en ny token</li>
                    </ol>
                    <p className="mt-2 text-xs font-semibold bg-yellow-100 p-2 rounded">
                      ⚠️ OBS: Purchase orders kräver scopet "warehouse" med Write-behörighet enligt Fortnox API-dokumentation.
                    </p>
                    <p className="mt-2 text-xs font-semibold bg-red-100 p-2 rounded">
                      🔴 VIKTIGT: Om du redan har en access token men får "missing.rights" fel, måste du:<br/>
                      1. Klicka på "Återauktorisera" ovan för att rensa gamla token<br/>
                      2. Klicka på "Auktorisera med Fortnox" för att få ny token med rätt scopes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {saved && (
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-800">
                  ✓ API-nycklar sparade!
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={handleClear}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded"
              >
                Radera nycklar
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Spara nycklar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get API keys
export function getApiKeys(): ApiKeys | null {
  const savedKeys = localStorage.getItem('apiKeys')
  if (!savedKeys) return null
  return JSON.parse(savedKeys)
}

// Helper function to check if keys are configured
export function hasApiKeys(): boolean {
  const keys = getApiKeys()
  return !!(keys?.fortnoxAccessToken && keys?.fortnoxClientSecret)
}

// Check if OAuth is configured (has Client ID and Secret)
export function hasOAuthConfigured(): boolean {
  const keys = getApiKeys()
  return !!(keys?.fortnoxClientId && keys?.fortnoxClientSecret)
}

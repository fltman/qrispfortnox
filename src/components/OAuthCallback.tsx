import { useEffect, useState } from 'react'

interface OAuthCallbackProps {
  onComplete: () => void
}

export default function OAuthCallback({ onComplete }: OAuthCallbackProps) {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [message, setMessage] = useState('Bearbetar auktorisering...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')
        const errorDescription = params.get('error_description')

        // Log all URL parameters for debugging
        console.log('OAuth callback URL parameters:', {
          code: code ? 'received' : 'missing',
          error,
          errorDescription,
          allParams: Object.fromEntries(params.entries())
        })

        if (error) {
          let errorMessage = errorDescription || error

          // Provide helpful messages for common errors
          if (error === 'unsupported_scope') {
            errorMessage = `Scope inte stödd i din Fortnox integration.\n\n` +
                          `Kontrollera att följande scopes är aktiverade i Fortnox Developer Portal:\n` +
                          `- companyinformation\n\n` +
                          `Gå till: https://developer.fortnox.se/ → Din integration → Scopes`
          }

          throw new Error(errorMessage)
        }

        if (!code) {
          throw new Error('Ingen auktoriseringskod mottagen från Fortnox')
        }

        // Get stored keys from localStorage
        const savedKeys = localStorage.getItem('apiKeys')
        if (!savedKeys) {
          throw new Error('API-nycklar saknas. Gå till inställningar och konfigurera dina nycklar.')
        }

        const keys = JSON.parse(savedKeys)

        // Exchange code for access token
        setMessage('Utbyter auktoriseringskod mot access token...')

        const response = await fetch('/api/fortnox/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code,
            clientId: keys.fortnoxClientId,
            clientSecret: keys.fortnoxClientSecret,
            redirectUri: keys.fortnoxRedirectUri
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.details || errorData.error || 'Kunde inte få access token')
        }

        const data = await response.json()

        console.log('Received token data from server:')
        console.log('- Scopes:', data.scope)
        console.log('- Token preview:', data.accessToken?.substring(0, 20) + '...')
        console.log('- Old token preview:', keys.fortnoxAccessToken?.substring(0, 20) + '...')

        // Save access token to localStorage
        const updatedKeys = {
          ...keys,
          fortnoxAccessToken: data.accessToken
        }

        localStorage.setItem('apiKeys', JSON.stringify(updatedKeys))

        console.log('✓ New token saved to localStorage')
        console.log('- New token matches old?', data.accessToken === keys.fortnoxAccessToken)

        setStatus('success')
        setMessage('Auktorisering lyckades! Omdirigerar...')

        // Redirect back to main page after 2 seconds
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Ett okänt fel inträffade')
      }
    }

    handleCallback()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {status === 'processing' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Bearbetar...
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Klart!
            </h2>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Fel uppstod
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tillbaka till start
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

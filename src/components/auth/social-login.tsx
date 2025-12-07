'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader } from 'lucide-react'
import { toast } from 'sonner'

import { DEFAULT_AUTH_REDIRECT_URL } from '@/routes'

import { GoogleLogo } from '@/components/icons'

const socialProviders = [
  {
    name: 'Google',
    icon: <GoogleLogo className="h-4 w-4" />,
    provider: 'google',
  },
]

export const SocialLogin = () => {
  const t = useTranslations('login')
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl')
  const [loading, setLoading] = useState<boolean>(false)

  const loginWith = async (provider: string) => {
    try {
      setLoading(true)
      await signIn(provider, { callbackUrl: callbackUrl || DEFAULT_AUTH_REDIRECT_URL })
    } catch (error) {
      toast.error(t('login-error'))
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {socialProviders.map((sp) => (
        <button
          key={sp.provider}
          className="bg-ocean-400 group text-ocean-200 hover:text-ocean-300 hover:bg-ocean-100 shadow-center-sm flex items-center justify-center space-x-3 rounded-lg px-5 py-3 transition-colors duration-300 focus-visible:outline-none"
          disabled={loading}
          onClick={() => loginWith(sp.provider)}
        >
          {sp.icon}
          <span className="font-semibold">
            {t('login-with')}
            <span className="text-ocean-100 group-hover:text-ocean-400 ms-px font-bold duration-300">
              {sp.name}
            </span>
          </span>
        </button>
      ))}
      {loading && <Loader className="text-ocean-100 animate-spin" size={24} />}
    </div>
  )
}

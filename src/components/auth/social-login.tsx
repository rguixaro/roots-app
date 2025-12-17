'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { motion, Variants, AnimatePresence } from 'framer-motion'
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

const buttonVariants: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02, transition: { type: 'spring', stiffness: 400, damping: 15 } },
  tap: { scale: 0.98 },
  loading: { scale: 0.98 },
}

const contentVariants: Variants = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -10 },
}

const loaderVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.8 },
}

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
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {socialProviders.map((sp) => (
        <motion.button
          key={sp.provider}
          variants={buttonVariants}
          initial="idle"
          whileHover={!loading ? 'hover' : 'loading'}
          whileTap={!loading ? 'tap' : 'loading'}
          className="bg-ocean-400 group text-ocean-200 hover:text-ocean-300 hover:bg-ocean-100 shadow-center-sm flex w-3/4 items-center justify-center space-x-3 rounded-lg px-5 py-3 transition-colors duration-300 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
          onClick={() => loginWith(sp.provider)}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                variants={loaderVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex h-6 items-center space-x-3"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader size={20} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex h-6 items-center space-x-3"
              >
                {sp.icon}
                <span className="font-semibold">
                  {t('login-with')}
                  <span className="text-ocean-100 group-hover:text-ocean-400 ms-px font-bold duration-300">
                    {sp.name}
                  </span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      ))}
    </div>
  )
}

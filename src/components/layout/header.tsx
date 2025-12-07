'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

import { TypographyH3 } from '@/ui'

export const Header = ({ username }: { username: string }) => {
  const pathname = usePathname()

  const hideHeader =
    pathname?.match(/^\/trees\/[^\/]+$/) &&
    !pathname.includes('/edit/') &&
    !pathname.includes('/new')

  if (hideHeader) return null

  let displayName = ''
  if (username) {
    displayName = username.split(' ')[0]
    if (displayName.length > 12) displayName = displayName.slice(0, 12) + '…'
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-ocean-400 top-0 z-50 py-4"
      >
        <Link href="/" className="flex items-center justify-center gap-3 px-6">
          <motion.img
            src={'/logo.svg'}
            width={72}
            height={72}
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            whileHover={{
              scale: 1.1,
              rotate: 5,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              type: 'spring',
              stiffness: 150,
            }}
          >
            <TypographyH3 className="text-pale-ocean m-0 font-extrabold tracking-tight">
              {displayName && (
                <motion.span
                  className="text-ocean-100 font-semibold"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  {`${displayName}'s`}{' '}
                </motion.span>
              )}
              <motion.span
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: displayName ? 0.45 : 0.35 }}
              >
                roots
              </motion.span>
            </TypographyH3>
          </motion.div>
        </Link>
      </motion.div>
      <motion.div
        className="mx-auto w-5/6 items-center justify-center"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{
          duration: 0.7,
          delay: 0.5,
          ease: 'easeInOut',
        }}
      >
        <div className="bg-ocean-200 shadow-center-sm h-3 rounded-b" />
      </motion.div>
    </>
  )
}

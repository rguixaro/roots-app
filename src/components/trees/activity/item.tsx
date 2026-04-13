'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { motion, Variants } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

import { ActivityLog } from '@/types'

import { formatActivityLog } from '@/utils'
import { cn } from '@/utils'

export function ActivityItem({ log, index }: { log: ActivityLog; index: number }) {
  const locale = useLocale()
  const t_logs = useTranslations('log_activities')
  const [isExpanded, setIsExpanded] = useState(false)

  const display = formatActivityLog(log.action, log.metadata as Record<string, any>, t_logs)
  const hasChanges = display.details && display.details.length > 0

  const motions: Variants = {
    offscreen: { opacity: 0, y: 75 },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 0.8, delay: index * 0.15 },
    },
  }

  const changeVariants: Variants = {
    collapsed: { opacity: 0, height: 0 },
    expanded: {
      opacity: 1,
      height: 'auto',
      transition: { type: 'spring', bounce: 0.2, duration: 0.4 },
    },
  }

  const chevronVariants: Variants = { collapsed: { rotate: 0 }, expanded: { rotate: 180 } }

  return (
    <motion.div
      initial="offscreen"
      whileInView="onscreen"
      variants={motions}
      viewport={{ once: true, amount: 0.01 }}
    >
      <div
        className={cn(
          'group transition-all duration-300',
          'my-2 rounded-lg border-2 px-3 py-2 sm:px-5 sm:py-3',
          'flex flex-col items-start justify-start',
          'border-ocean-100 bg-pale-ocean hover:shadow-md',
          'text-ocean-300 hover:bg-ocean-50'
        )}
      >
        <div className="w-full sm:hidden">
          <div
            className={cn('flex w-full items-start', hasChanges && 'cursor-pointer')}
            onClick={() => hasChanges && setIsExpanded(!isExpanded)}
          >
            <div className={cn('flex min-w-0 flex-1 flex-col items-start justify-start space-y-1')}>
              <span className="text-sm font-bold">{display.title}</span>
              <span className="text-ocean-200 text-sm font-semibold">{display.subtitle}</span>
            </div>
            {hasChanges && (
              <motion.div
                variants={chevronVariants}
                animate={isExpanded ? 'expanded' : 'collapsed'}
                className="ms-3 mt-0.5 shrink-0"
              >
                <ChevronDown size={18} className="text-ocean-200" />
              </motion.div>
            )}
          </div>
          <div className="text-ocean-200 mt-2 flex flex-col text-xs">
            <span>{new Date(log.createdAt).toLocaleDateString(locale)}</span>
            <span className="font-semibold">
              <span className="font-normal">{`${t_logs('edited-by')} `}</span>
              {log.user?.name ?? t_logs('deleted-user')}
            </span>
          </div>
        </div>
        <div className="hidden w-full items-center sm:flex">
          {hasChanges && (
            <motion.div
              variants={chevronVariants}
              animate={isExpanded ? 'expanded' : 'collapsed'}
              className="me-3 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown size={18} className="text-ocean-200" />
            </motion.div>
          )}
          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col items-start justify-start space-y-1',
              hasChanges && 'cursor-pointer'
            )}
            onClick={() => hasChanges && setIsExpanded(!isExpanded)}
          >
            <span className="text-sm font-bold">{display.title}</span>
            <span className="text-ocean-200 text-sm font-semibold">{display.subtitle}</span>
          </div>
          <div className="border-ocean-200/50 flex flex-col border-l-2 pl-3 text-xs">
            <span>{new Date(log.createdAt).toLocaleDateString(locale)}</span>
            <span className="font-semibold">
              <span className="font-normal">{`${t_logs('edited-by')} `}</span>
              {log.user?.name ?? t_logs('deleted-user')}
            </span>
          </div>
        </div>
        {hasChanges && (
          <motion.div
            variants={changeVariants}
            animate={isExpanded ? 'expanded' : 'collapsed'}
            className="overflow-hidden"
          >
            <div className="text-ocean-200 border-ocean-100 mt-3 flex flex-col space-y-2 border-t-2 pt-3">
              <span className="text-ocean-300 text-xs font-bold">{t_logs('metadata')}</span>
              <div className="flex flex-col space-y-1">
                {display.details?.map((detail, idx) => {
                  const field = detail.split(':')[0].trim()
                  const value = detail.split(':')[1]?.trim() || ''
                  return (
                    <span key={idx} className="text-xs font-semibold">
                      {`${field}: `}
                      <span className="font-light">{value}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

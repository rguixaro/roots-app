'use client'

import { useTranslations } from 'next-intl'
import { motion, Variants } from 'framer-motion'

import { ActivityLog } from '@/types'
import { formatActivityLog } from '@/utils'

import { cn } from '@/utils'

export function ActivityItem({ log, index }: { log: ActivityLog; index: number }) {
  const t_logs = useTranslations('log_activities')

  const display = formatActivityLog(log.action, log.metadata as Record<string, any>, t_logs)

  const motions: Variants = {
    offscreen: { opacity: 0, y: 75 },
    onscreen: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', bounce: 0.2, duration: 0.8, delay: index * 0.15 },
    },
  }

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
          'my-2 rounded-lg border-4 px-3 py-2 sm:px-5 sm:py-3',
          'flex flex-col items-start justify-start space-y-2',
          'sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-5',
          'border-ocean-100 bg-pale-ocean hover:shadow-md',
          'text-ocean-300 hover:bg-ocean-50'
        )}
      >
        <div className={cn('flex min-w-0 flex-col items-start justify-start space-y-1')}>
          <span className="text-sm font-bold">{display.title}</span>
          <span className="text-ocean-200 text-sm font-semibold">{display.subtitle}</span>
          {display.details && (
            <div>
              <span className="text-xs font-bold">Changes</span>
              <div className="text-ocean-200 flex flex-col space-y-0 text-xs">
                {display.details?.map((detail, idx) => {
                  const field = detail.split(':')[0].trim()
                  const value = detail.split(':')[1]?.trim() || ''
                  return (
                    <span key={idx} className="font-semibold">
                      {`${field}: `}
                      <span className="font-light">{value}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="border-ocean-200/50 flex flex-col border-l-2 pl-3 text-xs">
          <span>{log.createdAt.toISOString().split('T')[0]}</span>
          <span className="font-bold">
            <span className="font-normal">{`${t_logs('edited-by')} `}</span>
            {log.user.name}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

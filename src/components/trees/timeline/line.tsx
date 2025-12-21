'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ChevronsLeftRightEllipsis } from 'lucide-react'

import { GoBack } from '@/components/layout'

import { Picture, TypographyH5 } from '@/ui'

import { TimelineEvent, TimelineNode } from '@/types'

import { cn } from '@/utils'

import { AnimatedEvent } from './event'

const DAY_MS = 1000 * 60 * 60 * 24
const BASE_PIXELS_PER_YEAR = 50
const MIN_EVENT_DISTANCE = 140
const GAP_THRESHOLD_YEARS = 5
const MAX_GAP_PIXELS = 500
const GAP_LABEL_OFFSET = 0.5
const GAP_LABEL_WIDTH = 80

export function Timeline({ events, slug }: { events: TimelineEvent[]; slug: string }) {
  const t_trees = useTranslations('trees')

  /**
   * Compute timeline items with positions based on event dates
   * @return { nodes: TimelineNode[]; positions: number[]; width: number }
   */
  const items = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime())
    if (sorted.length === 0) return { nodes: [], positions: [], width: 0 }

    const result: TimelineNode[] = []
    const positions: number[] = []

    let currentX = 0
    let lastEventX = 0

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const gapYears = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (DAY_MS * 365)

        let gapPixels = gapYears * BASE_PIXELS_PER_YEAR

        if (gapPixels > MAX_GAP_PIXELS) gapPixels = MAX_GAP_PIXELS
        if (gapPixels < MIN_EVENT_DISTANCE) gapPixels = MIN_EVENT_DISTANCE

        currentX += gapPixels

        if (gapYears > GAP_THRESHOLD_YEARS) {
          const gapCenterX =
            lastEventX + (currentX - lastEventX) * GAP_LABEL_OFFSET - GAP_LABEL_WIDTH / 2

          result.push({ type: 'gap', years: Math.round(gapYears) })
          positions.push(gapCenterX)
        }
      }
      result.push({ type: 'event', item: sorted[i] })
      positions.push(currentX)

      lastEventX = currentX
    }

    const width = currentX + 200

    return { nodes: result, positions, width }
  }, [events])

  const { nodes: timelineEvents, positions, width } = items

  let eventIndex = 0

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col items-center pt-2">
      <div className="flex w-3/4 flex-col sm:w-3/4">
        <GoBack to={`/trees/${slug}`} />
        <TypographyH5>{t_trees('timeline')}</TypographyH5>
        <p className="mb-5">{t_trees('timeline-description')}</p>
      </div>
      <div className="styled-scrollbar relative h-72 w-full overflow-x-auto px-36">
        <div className="relative h-full" style={{ width: `${width}px` }}>
          <div className="bg-ocean-100 absolute top-1/2 right-0 left-0 h-2 rounded" />

          {timelineEvents.map((event, index) => {
            const x = positions[index]

            if (event.type === 'gap')
              return (
                <AnimatedEvent key={index} x={x} className="top-1/2">
                  <div className="absolute bottom-2 flex flex-col items-center select-none">
                    <ChevronsLeftRightEllipsis />
                    <div className="text-xs whitespace-nowrap">
                      {t_trees('timeline-gap', { years: event.years })}
                    </div>
                  </div>
                </AnimatedEvent>
              )

            const isAbove = eventIndex % 2 === 0
            eventIndex++

            return (
              <AnimatedEvent key={index} x={x} className="group top-1/2">
                <motion.div
                  className={cn(
                    'bg-ocean-100 absolute top-3.5 left-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2',
                    'border-ocean-400 transition-all duration-300',
                    isAbove
                      ? 'rounded-tl-md rounded-br-md border-b-4 group-hover:border-t-4 group-hover:border-b-0'
                      : 'rounded-tr-md rounded-bl-md border-t-4 group-hover:border-t-0 group-hover:border-b-4'
                  )}
                />
                {isAbove ? (
                  <div
                    className={cn(
                      'shadow-center-sm absolute bottom-1/2 left-1/2 mb-2 flex w-36 -translate-x-1/2 flex-col items-center px-2 py-2 text-center',
                      'group-hover:bg-ocean-400 space-y-2 rounded-lg transition-all duration-300 select-none',
                      event.item.type == 'birth' ? 'bg-pale-ocean' : 'bg-ocean-100'
                    )}
                  >
                    <div className="group-hover:text-ocean-50 text-ocean-400 self-start text-xs font-medium opacity-70 transition-colors">
                      {t_trees(`timeline-event-${event.item.type}`)}
                    </div>
                    <div className="my-px flex w-full items-center justify-between space-x-2">
                      <div className="flex flex-col items-start">
                        <div className="group-hover:text-ocean-50 text-left text-sm leading-3.5 font-semibold transition-colors">
                          {event.item.name}
                        </div>
                        <div className="group-hover:text-ocean-50 text-ocean-300 text-xs font-light transition-colors">
                          {event.item.place}
                        </div>
                      </div>
                      {event.item.picture && (
                        <Picture
                          fileKey={event.item.picture}
                          classNameContainer={cn(
                            'h-10 w-10 shadow-center-sm flex-shrink-0 duration-300 group-hover:border-ocean-50 rounded-md border-ocean-400'
                          )}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'shadow-center-sm absolute top-1/2 left-1/2 mt-8 flex w-36 -translate-x-1/2 flex-col items-center px-0 py-2 text-center',
                      'group-hover:bg-ocean-400 space-y-0 rounded-lg px-2 transition-colors duration-300 select-none',
                      event.item.type == 'birth' ? 'bg-pale-ocean' : 'bg-ocean-100'
                    )}
                  >
                    <div className="group-hover:text-ocean-50 text-ocean-400 self-start text-xs font-medium opacity-70 transition-colors">
                      {t_trees(`timeline-event-${event.item.type}`)}
                    </div>
                    <div className="my-px flex w-full items-center justify-between space-x-2">
                      <div className="flex flex-col items-start">
                        <div className="group-hover:text-ocean-50 text-left text-sm leading-3.5 font-semibold transition-colors">
                          {event.item.name}
                        </div>
                        <div className="group-hover:text-ocean-50 text-ocean-300 text-xs font-light transition-colors">
                          {event.item.place}
                        </div>
                      </div>
                      {event.item.picture && (
                        <Picture
                          fileKey={event.item.picture}
                          classNameContainer={cn(
                            'h-10 w-10 shadow-center-sm flex-shrink-0 duration-300 group-hover:border-ocean-50 rounded-md border-ocean-400'
                          )}
                        />
                      )}
                    </div>
                  </div>
                )}
                <div
                  className={cn(
                    'absolute left-1/2 mt-2 -translate-x-1/2 text-xs transition-all duration-300 select-none group-hover:font-bold',
                    isAbove ? 'top-8' : 'bottom-4'
                  )}
                >
                  {new Date(event.item.date).toLocaleDateString('en-GB')}
                </div>
              </AnimatedEvent>
            )
          })}
        </div>
      </div>
    </div>
  )
}

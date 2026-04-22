'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronsLeftRightEllipsis, Columns3, Rows3 } from 'lucide-react'

import { GoBack } from '@/components/layout'

import { Picture, TypographyH5 } from '@/ui'

import { TimelineEvent, TimelineNode } from '@/types'

import { cn } from '@/utils'

import { AnimatedEvent, Orientation } from './event'

const DAY_MS = 1000 * 60 * 60 * 24
const BASE_PIXELS_PER_YEAR = 50
const MIN_EVENT_DISTANCE = 140
const GAP_THRESHOLD_YEARS = 5
const MAX_GAP_PIXELS = 500
const GAP_LABEL_OFFSET = 0.5
const GAP_LABEL_WIDTH = 80

export function Timeline({ events, slug }: { events: TimelineEvent[]; slug: string }) {
  const t_trees = useTranslations('trees')
  const locale = useLocale()

  const [orientation, setOrientation] = useState<Orientation>('horizontal')

  useEffect(() => {
    if (window.matchMedia('(max-width: 639px)').matches) setOrientation('vertical')
  }, [])

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))
  }

  const isHorizontal = orientation === 'horizontal'

  /**
   * Compute timeline items with positions based on event dates.
   * Offsets are axis-agnostic — used as `x` in horizontal mode and `y` in vertical mode.
   * @return { nodes: TimelineNode[]; positions: number[]; span: number }
   */
  const items = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.getTime() - b.date.getTime())
    if (sorted.length === 0) return { nodes: [], positions: [], span: 0 }

    const result: TimelineNode[] = []
    const positions: number[] = []

    let current = 0
    let lastEvent = 0

    for (let i = 0; i < sorted.length; i++) {
      if (i > 0) {
        const gapYears = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (DAY_MS * 365)

        let gapPixels = gapYears * BASE_PIXELS_PER_YEAR

        if (gapPixels > MAX_GAP_PIXELS) gapPixels = MAX_GAP_PIXELS
        if (gapPixels < MIN_EVENT_DISTANCE) gapPixels = MIN_EVENT_DISTANCE

        current += gapPixels

        if (gapYears > GAP_THRESHOLD_YEARS) {
          const gapCenter =
            lastEvent + (current - lastEvent) * GAP_LABEL_OFFSET - GAP_LABEL_WIDTH / 2

          result.push({ type: 'gap', years: Math.round(gapYears) })
          positions.push(gapCenter)
        }
      }
      result.push({ type: 'event', item: sorted[i] })
      positions.push(current)

      lastEvent = current
    }

    const span = current + 200

    return { nodes: result, positions, span }
  }, [events])

  const { nodes: timelineEvents, positions, span } = items

  let eventIndex = 0

  return (
    <div className="text-ocean-400 z-0 my-2 flex w-full flex-col items-center pt-2">
      <div className="flex w-3/4 flex-col sm:w-3/4">
        <GoBack variant="filled" to={`/trees/${slug}`} className="w-auto" />
        <div className="flex items-center justify-between gap-2">
          <TypographyH5>{t_trees('timeline')}</TypographyH5>
          <button
            type="button"
            onClick={toggleOrientation}
            aria-label={t_trees('timeline-orientation-toggle')}
            title={
              isHorizontal
                ? t_trees('timeline-orientation-vertical')
                : t_trees('timeline-orientation-horizontal')
            }
            className={cn(
              'text-ocean-400 bg-pale-ocean hover:bg-ocean-200/15 border-ocean-200/20 shadow-center-sm',
              'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-2 transition-colors'
            )}
          >
            {isHorizontal ? <Rows3 size={18} /> : <Columns3 size={18} />}
          </button>
        </div>
        <p className="mb-5">{t_trees('timeline-description')}</p>
      </div>

      {isHorizontal ? (
        <div className="styled-scrollbar relative h-72 w-full overflow-x-auto px-36">
          <div className="relative h-full" style={{ width: `${span}px` }}>
            <div className="bg-ocean-100 absolute top-1/2 right-0 left-0 h-2 rounded" />

            {timelineEvents.map((event, index) => {
              const offset = positions[index]

              if (event.type === 'gap')
                return (
                  <AnimatedEvent
                    key={index}
                    offset={offset}
                    orientation="horizontal"
                    className="top-1/2"
                  >
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
                <AnimatedEvent
                  key={index}
                  offset={offset}
                  orientation="horizontal"
                  className="group top-1/2"
                >
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
                    {new Date(event.item.date).toLocaleDateString(locale)}
                  </div>
                </AnimatedEvent>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="styled-scrollbar relative w-full overflow-y-auto px-4 py-16">
          <div className="relative mx-auto w-full max-w-2xl" style={{ height: `${span}px` }}>
            <div className="bg-ocean-100 absolute top-0 bottom-0 left-1/2 w-2 -translate-x-1/2 rounded" />

            {timelineEvents.map((event, index) => {
              const offset = positions[index]

              if (event.type === 'gap')
                return (
                  <AnimatedEvent
                    key={index}
                    offset={offset}
                    orientation="vertical"
                    className="left-1/2"
                  >
                    <div className="absolute -left-20 flex items-center gap-2 select-none">
                      <ChevronsLeftRightEllipsis className="rotate-90" />
                      <div className="text-xs whitespace-nowrap">
                        {t_trees('timeline-gap', { years: event.years })}
                      </div>
                    </div>
                  </AnimatedEvent>
                )

              const isLeft = eventIndex % 2 === 0
              eventIndex++

              return (
                <AnimatedEvent
                  key={index}
                  offset={offset}
                  orientation="vertical"
                  className="group left-1/2"
                >
                  <motion.div
                    className={cn(
                      'bg-ocean-100 absolute top-1/2 left-0 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2',
                      'border-ocean-400 transition-all duration-300',
                      isLeft
                        ? 'rounded-tr-md rounded-bl-md border-r-4 group-hover:border-r-0 group-hover:border-l-4'
                        : 'rounded-tl-md rounded-br-md border-l-4 group-hover:border-r-4 group-hover:border-l-0'
                    )}
                  />
                  <div
                    className={cn(
                      'shadow-center-sm absolute top-1/2 flex w-44 -translate-y-1/2 flex-col items-start px-3 py-2 text-left',
                      'group-hover:bg-ocean-400 space-y-1 rounded-lg transition-all duration-300 select-none',
                      event.item.type == 'birth' ? 'bg-pale-ocean' : 'bg-ocean-100',
                      isLeft ? 'right-6' : 'left-6'
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="group-hover:text-ocean-50 text-ocean-400 text-xs font-medium opacity-70 transition-colors">
                        {t_trees(`timeline-event-${event.item.type}`)}
                      </div>
                      <div className="group-hover:text-ocean-50 text-ocean-300 text-xs font-light transition-colors group-hover:font-bold">
                        {new Date(event.item.date).toLocaleDateString(locale)}
                      </div>
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
                </AnimatedEvent>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

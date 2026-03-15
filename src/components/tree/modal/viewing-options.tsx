'use client'

import { Node } from 'reactflow'
import { Minus, Plus } from 'lucide-react'
import { motion, Variants, AnimatePresence } from 'framer-motion'

import { Button } from '@/ui'

import { TreeNode } from '@/types'

import { cn } from '@/utils'
import { useTranslations } from 'next-intl'

interface ViewingOptionsProps {
  enabled: boolean
  visible: boolean
  nodes: TreeNode[]
  visibleNodes: Node[]
  showAllNodes: boolean
  adjustGenerations: (direction: 'up' | 'down', delta: number) => void
  generationsUp: number
  generationsDown: number
  toggleShowAll: () => void
  focusOnNode: string | null
  totalNodeCount: number
}

const slideFromBottom: Variants = {
  hidden: { y: 176, opacity: 1 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 25, delay: 0.2 },
  },
  exit: {
    y: 176,
    opacity: 1,
    transition: { duration: 0.2 },
  },
}

export function ViewingOptions({
  enabled,
  visible,
  nodes,
  visibleNodes,
  showAllNodes,
  adjustGenerations,
  generationsUp,
  generationsDown,
  toggleShowAll,
  focusOnNode,
  totalNodeCount,
}: ViewingOptionsProps) {
  const t_trees = useTranslations('trees')

  if (!enabled) return null

  const visibleNodesCount = visibleNodes.filter(
    (n) => n.type !== 'COUPLE' && n.data.type !== 'SPOUSE'
  ).length

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          variants={slideFromBottom}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            'absolute right-auto bottom-11 left-1/2 z-9 h-44 -translate-x-1/2 sm:-bottom-1',
            'text-ocean-50 bg-ocean-400 shadow-center-lg space-y-2 rounded-lg rounded-b-none px-4 py-4'
          )}
        >
          <div className="flex min-w-0 space-x-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center space-x-1 text-xs">
                <span>{t_trees('showing')}</span>
                <span className="font-bold">{`${visibleNodesCount} / ${totalNodeCount}`}</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="flex-1 text-left font-medium">{t_trees('ancestors')}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'bg-ocean-300 h-7 w-7 cursor-pointer rounded p-1',
                      'hover:bg-ocean-200 transition-colors duration-300',
                      'outline-none focus:outline-none focus-visible:outline-none'
                    )}
                    onClick={() => adjustGenerations('up', -1)}
                    disabled={generationsUp <= 1 || showAllNodes}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="w-6 text-center font-bold">{generationsUp}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'bg-ocean-300 h-7 w-7 cursor-pointer rounded p-1',
                      'hover:bg-ocean-200 transition-colors duration-300',
                      'outline-none focus:outline-none focus-visible:outline-none'
                    )}
                    onClick={() => adjustGenerations('up', 1)}
                    disabled={generationsUp >= 10 || showAllNodes}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="flex-1 text-left font-medium">{t_trees('descendants')}</span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'bg-ocean-300 h-7 w-7 cursor-pointer rounded p-1',
                      'hover:bg-ocean-200 transition-colors duration-300',
                      'outline-none focus:outline-none focus-visible:outline-none'
                    )}
                    onClick={() => adjustGenerations('down', -1)}
                    disabled={generationsDown <= 1 || showAllNodes}
                  >
                    <Minus size={16} />
                  </Button>
                  <span className="w-6 text-center font-bold">{generationsDown}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      'bg-ocean-300 h-7 w-7 cursor-pointer rounded p-1',
                      'hover:bg-ocean-200 transition-colors duration-300',
                      'outline-none focus:outline-none focus-visible:outline-none'
                    )}
                    onClick={() => adjustGenerations('down', 1)}
                    disabled={generationsDown >= 10 || showAllNodes}
                  >
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            </div>
            <div className="bg-ocean-300 border-ocean-200 flex w-28 flex-col space-y-1 rounded-xl border-2 p-2 text-xs">
              <span>{t_trees('focus-on')}</span>
              <div className="px-2 font-bold wrap-break-word whitespace-normal">
                {nodes.find((n) => n.id === focusOnNode)?.fullName || '-'}
              </div>
            </div>
          </div>
          <div className="border-ocean-200 my-2 border-t" />
          <Button
            size="sm"
            variant="default"
            className="w-full text-xs font-medium"
            disabled={showAllNodes}
            onClick={toggleShowAll}
          >
            {t_trees('show-all-nodes')}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useState, useMemo } from 'react'
import { Plus, X } from 'lucide-react'

import { Input, TypographyH5 } from '@/ui'
import { Picture } from '@/types'

interface PictureTagsModalProps {
  show: boolean
  selectedPicture: Picture
  availableNodes: Array<{ id: string; fullName: string; alias: string | null }>
  onClose: () => void
  onAddTag: (pictureId: string, nodeId: string) => Promise<unknown>
  onRemoveTag: (pictureId: string, tagId: string) => Promise<unknown>
  t_trees: (key: string) => string
}

export function PictureTagsModal({
  show,
  selectedPicture,
  availableNodes,
  onClose,
  onAddTag,
  onRemoveTag,
  t_trees,
}: PictureTagsModalProps) {
  const [searchTerm, setSearchTerm] = useState('')

  if (!show) return null

  const filteredNodes = useMemo(() => {
    if (!searchTerm) return availableNodes
    return availableNodes.filter((node) =>
      `${node.fullName} ${node.alias ?? ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableNodes, searchTerm])

  return (
    <>
      <div className="bg-ocean-500/50 fixed inset-0 z-60 backdrop-blur-xs" onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 z-60 w-full max-w-5/6 -translate-x-1/2 -translate-y-1/2 transform sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-pale-ocean text-ocean-400 shadow-center rounded-xl">
          <div className="border-ocean-100 flex items-center justify-between border-b-4 px-6 py-4">
            <TypographyH5>{t_trees('node-gallery-tags')}</TypographyH5>
            <button
              onClick={onClose}
              className="hover:bg-ocean-200/15 rounded p-1 transition-colors"
            >
              <X size={20} className="text-ocean-200" />
            </button>
          </div>
          <div className="styled-scrollbar max-h-96 overflow-y-auto px-6 py-4">
            {selectedPicture.tags && selectedPicture.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-ocean-300 mb-2 text-sm font-bold">
                  {t_trees('node-gallery-tags-currently')}
                </p>
                <div className="text-ocean-200 space-y-2">
                  {selectedPicture.tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="border-ocean-100 bg-ocean-50 flex items-center justify-between rounded-lg border-2 px-3 py-2"
                    >
                      <span className="text-sm font-medium">{`${tag.node?.fullName} ${tag.node?.alias ? `(${tag.node.alias})` : ''}`}</span>
                      <button
                        onClick={() => onRemoveTag(selectedPicture.id, tag.id)}
                        className="hover:bg-ocean-200/15 rounded transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {availableNodes.length > 0 && (
              <div className="w-full">
                <p className="text-ocean-300 mb-2 text-sm font-bold">
                  {t_trees('node-gallery-tags-add')}
                </p>
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder={t_trees('node-gallery-tags-search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-ocean-100 text-ocean-200 focus:ring-ocean-300 my-5 w-full min-w-[24ch] rounded border px-3 py-2 text-sm focus:ring-1 focus:outline-none"
                />
                <div className="text-ocean-200 space-y-2">
                  {filteredNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => onAddTag(selectedPicture.id, node.id)}
                      className="border-ocean-100 hover:bg-ocean-50 bg-pale-ocean flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors"
                    >
                      <span className="text-sm">
                        {`${node.fullName} ${node.alias ? `(${node.alias})` : ''}`}
                      </span>
                      <Plus size={18} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(!selectedPicture.tags || selectedPicture.tags.length === 0) &&
              filteredNodes.length === 0 && (
                <p className="text-ocean-300/70 py-8 text-center text-sm">
                  {t_trees('node-gallery-tags-add-none')}
                </p>
              )}
          </div>
        </div>
      </div>
    </>
  )
}

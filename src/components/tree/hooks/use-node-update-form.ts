'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { type z } from 'zod'

import { UpdateTreeNodeSchema } from '@/server/schemas'
import { updateTreeNode } from '@/server/actions'

import { Family, TreeNode } from '@/types'
import { useEffect } from 'react'

export function useNodeUpdateForm(family: Family, node: TreeNode | null, onSuccess?: () => void) {
  const t_toasts = useTranslations('toasts')
  const t_errors = useTranslations('errors')

  const form = useForm<z.infer<typeof UpdateTreeNodeSchema>>({
    resolver: zodResolver(UpdateTreeNodeSchema),
    defaultValues: { familyId: family.id, fullName: '' },
  })

  /** Reset form when node changes */
  useEffect(() => {
    if (!node) return

    form.reset({
      id: node.id,
      familyId: family.id,
      fullName: node.fullName ?? '',
      birthDate: node.birthDate ? new Date(node.birthDate) : null,
      deathDate: node.deathDate ? new Date(node.deathDate) : null,
      gender: node.gender ?? '',
    })
  }, [node])

  /**
   * Handle form update submission
   * @param values {z.infer<typeof UpdateTreeNodeSchema>}
   * @returns {Promise<void>}
   */
  const onSubmit = async (values: z.infer<typeof UpdateTreeNodeSchema>): Promise<void> => {
    const { error, message } = await updateTreeNode(values)
    if (error) {
      toast.error(t_errors(message || 'error'))
      return
    }

    toast.success(t_toasts('node-updated'))
    form.reset()
    onSuccess?.()
  }

  return { form, onSubmit }
}

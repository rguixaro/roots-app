'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { type z } from 'zod'

import { CreateTreeNodeSchema } from '@/server/schemas'
import { createTreeNode } from '@/server/actions'

import { Tree } from '@/types'

export function useNodeCreateForm(tree: Tree, onSuccess?: () => void) {
  const t_toasts = useTranslations('toasts')
  const t_errors = useTranslations('errors')

  const form = useForm<z.infer<typeof CreateTreeNodeSchema>>({
    resolver: zodResolver(CreateTreeNodeSchema),
    defaultValues: {
      treeId: tree.id,
      fullName: '',
      alias: '',
      birthPlace: '',
      deathPlace: '',
      biography: '',
    },
  })

  /**
   * Handle form creation submission
   * @param values {z.infer<typeof CreateTreeNodeSchema>}
   * @returns {Promise<void>}
   */
  const onSubmit = async (values: z.infer<typeof CreateTreeNodeSchema>): Promise<void> => {
    const { error, message } = await createTreeNode(values)
    if (error) {
      toast.error(t_errors(message || 'error'))
      return
    }

    toast.success(t_toasts('node-created'))
    form.reset()
    onSuccess?.()
  }

  return { form, onSubmit }
}

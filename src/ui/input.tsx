import * as React from 'react'

import { cn } from '@/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const InputGlobalStyles = cn(
  'flex h-9 w-full rounded border-2 border-ocean-200/50 bg-ocean-200/15',
  'px-3 py-1 text-sm text-ocean-200 font-medium shadow-sm transition-colors file:border-0',
  'file:bg-transparent file:text-sm file:font-medium placeholder:text-ocean-200',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ocean-200/50',
  'disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-200'
)

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cn(InputGlobalStyles, className)} ref={ref} {...props} />
  }
)
Input.displayName = 'Input'

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(InputGlobalStyles, 'resize-none', 'min-h-[100px]', className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }

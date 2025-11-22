import * as React from 'react'

import { cn } from '@/utils'
import { Calendar } from 'lucide-react'

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
    const isDate = type === 'date'

    return (
      <div className="relative w-fit">
        <input
          type={type}
          ref={ref}
          className={cn(InputGlobalStyles, 'pr-8', className, {
            'cursor-pointer appearance-none': isDate,
            '[&::-webkit-calendar-picker-indicator]:opacity-0': isDate,
            '[&::-webkit-calendar-picker-indicator]:absolute': isDate,
            '[&::-webkit-calendar-picker-indicator]:right-0': isDate,
            '[&::-webkit-calendar-picker-indicator]:w-full': isDate,
            '[&::-webkit-calendar-picker-indicator]:h-full': isDate,
          })}
          {...props}
        />

        {isDate && (
          <Calendar className="text-ocean-200 pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
        )}
      </div>
    )
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

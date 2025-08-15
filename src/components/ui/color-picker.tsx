import * as React from "react"
import { SketchPicker } from 'react-color'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"

interface ColorPickerProps {
  color?: string
  onChange: (color: string) => void
  presetColors?: string[]
  className?: string
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

const defaultPresetColors = [
  '#FFD700', '#EC4899', '#1E40AF', '#84CC16',
  '#FB7185', '#64748B', '#8B4513', '#C0C0C0',
  '#A78BFA', '#F97316', '#0EA5E9', '#DC2626',
  '#6366F1', '#F43F5E', '#22C55E', '#CA8A04'
]

export function ColorPicker({ 
  color = '#3B82F6', 
  onChange, 
  presetColors = defaultPresetColors,
  className = "",
  disabled = false,
  open,
  onOpenChange,
  children
}: ColorPickerProps) {
  const { theme } = useTheme()

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild disabled={disabled}>
        {children}
      </PopoverTrigger>
      <PopoverContent className="p-0 w-fit color-picker-popover border-0" align="end">
        <SketchPicker
          color={color}
          onChange={(colorResult) => {
            // Handle both hex and rgba colors
            if (colorResult.rgb && colorResult.rgb.a !== undefined && colorResult.rgb.a < 1) {
              const { r, g, b, a } = colorResult.rgb
              onChange(`rgba(${r}, ${g}, ${b}, ${a})`)
            } else {
              onChange(colorResult.hex)
            }
          }}
          disableAlpha={false}
          presetColors={presetColors}
          styles={{
            default: {
              picker: {
                boxShadow: 'none',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '12px 12px 6px 12px',
                backgroundColor: theme === 'dark' ? '#0a0a0a' : 'hsl(var(--sidebar))',
                color: theme === 'dark' ? 'hsl(var(--foreground))' : 'hsl(var(--foreground))'
              }
            }
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

import type { CSSProperties, ReactNode } from 'react'
import { A } from '@/data/constants'

type Variant = 'outline' | 'outline-muted' | 'primary'

interface PillButtonProps {
  children: ReactNode
  variant?: Variant
  height?: number
  fontSize?: number
  padding?: string
  title?: string
  onClick?: () => void
  style?: CSSProperties
}

/** The rounded action button used across every screen header and table toolbar. */
export function PillButton({
  children,
  variant = 'outline',
  height = 36,
  fontSize = 12.5,
  padding,
  title,
  onClick,
  style,
}: PillButtonProps) {
  const base: CSSProperties = {
    height,
    padding: padding ?? (variant === 'primary' ? '0 16px' : '0 14px'),
    borderRadius: 'var(--radius-pill)',
    fontSize,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    ...style,
  }

  if (variant === 'primary') {
    return (
      <button
        type="button"
        className="hc-primary"
        title={title}
        onClick={onClick}
        style={{
          ...base,
          border: 0,
          background: A,
          color: '#fff',
          boxShadow: 'var(--shadow-sm)',
          transition: 'transform 160ms, box-shadow 160ms',
        }}
      >
        {children}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={variant === 'outline-muted' ? 'hc-outline-ink' : 'hc-outline'}
      title={title}
      onClick={onClick}
      style={{
        ...base,
        border: '1px solid #E5E7EB',
        background: '#fff',
        color: variant === 'outline-muted' ? '#6B7280' : '#111827',
      }}
    >
      {children}
    </button>
  )
}

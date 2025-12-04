import React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  showText?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
}

export function Logo({ className, showText = true, size = 'md' }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <svg
        viewBox="0 0 100 100"
        className={sizeClasses[size]}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="100" height="100" rx="16" fill="#1E5BA8" />

        {/* RUMI text in cyan */}
        <text
          x="50"
          y="42"
          fontFamily="Arial, sans-serif"
          fontSize="20"
          fontWeight="900"
          fill="#5DD5ED"
          textAnchor="middle"
          letterSpacing="-1"
        >
          RUMI
        </text>

        {/* RENT text in white */}
        <text
          x="50"
          y="65"
          fontFamily="Arial, sans-serif"
          fontSize="20"
          fontWeight="900"
          fill="#FFFFFF"
          textAnchor="middle"
          letterSpacing="-1"
        >
          RENT
        </text>
      </svg>

      {showText && (
        <span className="text-xl font-semibold">RumiRent</span>
      )}
    </div>
  )
}

interface LogoTextProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const textSizeClasses = {
  sm: 'text-2xl',
  md: 'text-3xl',
  lg: 'text-5xl',
}

export function LogoText({ className, size = 'md' }: LogoTextProps) {
  return (
    <div className={cn('inline-flex flex-col', textSizeClasses[size], className)}>
      <span className="font-black tracking-tight leading-none" style={{ color: '#5DD5ED' }}>
        RUMI
      </span>
      <span className="font-black tracking-tight leading-none text-foreground">
        RENT
      </span>
    </div>
  )
}
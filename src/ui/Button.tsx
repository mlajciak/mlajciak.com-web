import React from 'react'
import './Button.css'

type BaseProps = {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

export type ButtonProps =
  | (BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (BaseProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string })

export const Button: React.FC<ButtonProps> = (props) => {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props
  const classes = `button button--${variant} button--${size} ${className}`.trim()

  if ('href' in rest && typeof rest.href === 'string') {
    const {
      href,
      rel = 'noopener noreferrer',
      target = '_blank',
      ...anchorProps
    } = rest
    return (
      <a className={classes} href={href} rel={rel} target={target} {...anchorProps}>
        {children}
      </a>
    )
  }

  const { type = 'button', ...buttonProps } = rest as React.ButtonHTMLAttributes<HTMLButtonElement>

  return (
    <button className={classes} type={type} {...buttonProps}>
      {children}
    </button>
  )
}

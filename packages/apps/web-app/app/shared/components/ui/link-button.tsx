import type { FC } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx } from 'styled-system/css'
import { type ButtonVariantProps, button } from 'styled-system/recipes'

interface LinkButtonProps extends LinkProps, ButtonVariantProps {}

export const LinkButton: FC<LinkButtonProps> = ({ children, className, variant, size, ...props }) => (
  <Link className={cx(button({ variant, size }), className)} {...props}>
    {children}
  </Link>
)

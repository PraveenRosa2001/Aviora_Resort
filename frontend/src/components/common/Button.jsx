import { Link } from 'react-router-dom';

/**
 * Aviora Resort Button — visual variants for the Tropical Grandeur design system
 * @param {string} variant - 'primary' | 'ghost' | 'dark' | 'solid' | 'terracotta'
 * @param {string} href - internal Link or external URL
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-5 py-2 text-xs',
    md: 'px-7 py-3 text-xs',
    lg: 'px-10 py-4 text-sm',
  };

  const variantClasses = {
    primary: [
      'border border-accent-gold text-accent-gold bg-transparent',
      'hover:bg-accent-gold hover:text-deep-wood',
      'focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2',
    ].join(' '),
    ghost: [
      'border border-resort-white/60 text-resort-white bg-transparent',
      'hover:border-accent-gold hover:text-accent-gold',
      'focus-visible:ring-2 focus-visible:ring-accent-gold',
    ].join(' '),
    dark: [
      'border border-sand/30 text-sand bg-transparent',
      'hover:border-accent-gold hover:text-accent-gold',
      'focus-visible:ring-2 focus-visible:ring-accent-gold',
    ].join(' '),
    solid: [
      'bg-accent-gold text-deep-wood border border-accent-gold',
      'hover:bg-gold-dark hover:border-gold-dark',
      'focus-visible:ring-2 focus-visible:ring-accent-gold',
    ].join(' '),
    terracotta: [
      'bg-primary text-white border border-primary',
      'hover:bg-primary-container hover:border-primary-container',
      'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    ].join(' '),
  };

  const base = [
    'inline-flex items-center justify-center gap-2',
    'eyebrow-label transition-all duration-300',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    sizeClasses[size],
    variantClasses[variant],
    className,
  ].join(' ');

  if (href) {
    // External link
    if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel')) {
      return (
        <a href={href} className={base} {...props}>
          {children}
        </a>
      );
    }
    // Internal React Router link
    return (
      <Link to={href} className={base} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
      {...props}
    >
      {children}
    </button>
  );
}

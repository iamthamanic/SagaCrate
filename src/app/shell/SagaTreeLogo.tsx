/**
 * SagaTreeLogo — Animiertes Markenlogo (Pulse + Aura + Sparkles) für Login und Auth-Loading.
 * Location: src/app/shell/SagaTreeLogo.tsx
 */
import { ImageWithFallback } from '../../shared/ui/figma/ImageWithFallback';
import logoImage from '../../assets/sagatree-logo.png';

interface SagaTreeLogoProps {
  /** Tailwind size classes for the wrap, e.g. `w-32 h-32`. */
  className?: string;
  alt?: string;
}

export function SagaTreeLogo({ className = 'w-32 h-32', alt = 'SagaTree Logo' }: SagaTreeLogoProps) {
  return (
    <div className={`login-logo-wrap relative ${className}`}>
      <span className="login-logo-sparkle login-logo-sparkle-1" aria-hidden="true" />
      <span className="login-logo-sparkle login-logo-sparkle-2" aria-hidden="true" />
      <span className="login-logo-sparkle login-logo-sparkle-3" aria-hidden="true" />
      <span className="login-logo-sparkle login-logo-sparkle-4" aria-hidden="true" />
      <span className="login-logo-sparkle login-logo-sparkle-5" aria-hidden="true" />
      <span className="login-logo-sparkle login-logo-sparkle-6" aria-hidden="true" />
      <ImageWithFallback
        src={logoImage}
        alt={alt}
        className="login-logo-image h-full w-full object-contain"
      />
    </div>
  );
}


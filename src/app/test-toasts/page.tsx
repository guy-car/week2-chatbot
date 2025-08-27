import Image from 'next/image';
import { colors, borderRadius, spacing, typography } from '~/styles/design-tokens';

type ToastVariant = 'success' | 'error' | 'neutral';

interface ToastPreviewProps {
  text: string;
  variant: ToastVariant;
  iconSrc?: string; // if undefined, render text-only
}

// Using inline styles to avoid adding new global CSS for the sandbox.
function ToastPreview({ text, variant, iconSrc }: ToastPreviewProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10,
    color: colors.text.primary,
    background: `linear-gradient(135deg, rgba(2,255,251,0.09) 0%, rgba(0,0,0,0.00) 55%, rgba(2,255,251,0.06) 100%), ${colors.background.secondary}`,
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    border: `0.5px solid ${colors.border.subtle}`,
    boxShadow: 'none',
    fontFamily: typography.fontFamily.primary,
    fontSize: typography.fontSize.md,
    lineHeight: 1.5,
    // Use natural width based on content like react-hot-toast defaults
    width: 'fit-content',
    maxWidth: 560,
  };

  const variantStyle: Record<ToastVariant, React.CSSProperties> = {
    success: {
      // Unified style: keep neutral styling for sandbox preview consistency
      border: `0.5px solid ${colors.border.subtle}`,
      boxShadow: 'none',
    },
    error: {
      border: `0.5px solid ${colors.border.subtle}`,
      boxShadow: 'none',
    },
    neutral: {
      border: `0.5px solid ${colors.border.subtle}`,
      boxShadow: 'none',
    },
  };

  return (
    <div style={{ ...baseStyle, ...variantStyle[variant] }}>
      {iconSrc ? (
        <Image
          src={iconSrc}
          alt=""
          width={20}
          height={20}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.35))' }}
          aria-hidden
        />
      ) : null}
      <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
    </div>
  );
}

export default function TestToastsPage() {
  // Mimic a top-center toast stack layout for previewing visuals only.
  const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ color: colors.text.accent, fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.xl, marginBottom: 8 }}>
        Toast Sandbox
      </h1>
      <p style={{ color: colors.text.secondary, marginBottom: 16 }}>
        Static previews using current dimensions/scale. Borders are 0.5px. Position simulated as top-center.
      </p>

      <div style={stackStyle}>
        {/* Star (watchlist add) */}
        <ToastPreview
          text="Movie added"
          variant="neutral"
          iconSrc="/icons/new_cyan/star.png"
        />

        {/* Eye (history add) */}
        <ToastPreview
          text="Marked as watched"
          variant="neutral"
          iconSrc="/icons/new_cyan/eye.png"
        />

        {/* Popcorn (like/dislike) */}
        <ToastPreview
          text="Taste profile updated"
          variant="neutral"
          iconSrc="/icons/new_cyan/popcorn.png"
        />

        {/* Deletion action with trash */}
        <ToastPreview
          text="Chat deleted"
          variant="neutral"
          iconSrc="/icons/new_cyan/trash.png"
        />

        {/* Text-only */}
        <ToastPreview
          text="Failed to add to watchlist"
          variant="neutral"
        />

        {/* Neutral/text-only */}
        <ToastPreview
          text="More info feature coming soon!"
          variant="neutral"
        />
      </div>
    </div>
  );
}



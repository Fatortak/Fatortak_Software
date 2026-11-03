import React, { useState } from "react";
import { cn } from "@/lib/utils";
import logoUrl from "@/assets/fatortak-logo.png";

interface BrandLogoProps {
  className?: string;
  imgClassName?: string;
  alt?: string;
}

/**
 * Single source of truth for the Fatortak wordmark.
 *
 * The file is imported through Vite so it is fingerprinted and emitted with
 * the application bundle instead of relying on a public path that may not be
 * copied by every deployment target.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  imgClassName,
  alt = "FATORTAK",
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "text-lg font-extrabold tracking-tight text-brand-700 dark:text-white",
          className
        )}
      >
        FATORTAK
      </span>
    );
  }

  return (
    <span className={cn("inline-flex min-w-0 items-center", className)}>
      <img
        src={logoUrl}
        alt={alt}
        onError={() => setFailed(true)}
        draggable={false}
        className={cn(
          "h-8 w-auto max-w-full object-contain dark:brightness-0 dark:invert",
          imgClassName
        )}
      />
    </span>
  );
};

export default BrandLogo;

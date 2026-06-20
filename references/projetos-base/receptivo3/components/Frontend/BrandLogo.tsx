import React from 'react';
import Link from 'next/link';

const LOGO_SRC = '/brand/logopratik.svg';
const RATIO = 3000 / 1350; // proporção do viewBox do SVG

interface BrandLogoProps {
  /** Altura do logo em px (a largura é calculada pela proporção original). */
  height?: number;
  /** Em fundos escuros, inverte o logo para branco (sem moldura/selo). */
  onDark?: boolean;
  priority?: boolean;
  className?: string;
  /** Quando false, renderiza só a imagem (sem <Link>). */
  asLink?: boolean;
}

export const BrandLogo = ({
  height = 40,
  onDark = false,
  priority = false,
  className = '',
  asLink = true,
}: BrandLogoProps) => {
  const width = Math.round(height * RATIO);

  const content = (
    // SVG vetorial servido direto de /public (sem otimizador do Next).
    // Em fundo escuro, o filtro torna o logo monocromático branco.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="Pratik Turismo"
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`object-contain transition-transform duration-300 group-hover:scale-[1.03] ${
        onDark ? '[filter:brightness(0)_invert(1)]' : ''
      }`}
      style={{ height, width: 'auto' }}
    />
  );

  if (!asLink) {
    return <span className={`inline-flex items-center group ${className}`}>{content}</span>;
  }

  return (
    <Link href="/" className={`inline-flex items-center group ${className}`} aria-label="Pratik Turismo — início">
      {content}
    </Link>
  );
};

import React from 'react';
import NextLink from 'next/link';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const Link: React.FC<LinkProps> = ({ href, children, ...props }) => {
  // Se for um link interno (começa com /), usa o roteador otimizado do Next.js
  if (href.startsWith('/')) {
    return (
      <NextLink href={href} {...props}>
        {children}
      </NextLink>
    );
  }
  
  // Se for link externo ou âncora (#), usa a tag 'a' normal
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

export default Link;
import React from 'react';

export interface RaidPropertyTreeProps {
  /** Open-world record/array/scalar. Unknown fields and nulls remain visible. */
  value: unknown;
  /** Attributes projected in the current diagram, rendered in Cascais Gold. */
  projectedNames?: readonly string[];
  /** Consumer-owned reference rendering; return undefined for the standard value renderer. */
  renderValue?: (value: unknown, path: readonly string[]) => React.ReactNode | undefined;
  /** Limit disclosure depth for exceptionally deep or cyclic objects. Default 16. */
  maxDepth?: number;
  className?: string;
}

/** DaisyUI disclosure tree shared by Studio, inspectors and application entity viewers. */
export function RaidPropertyTree({ value, projectedNames = [], renderValue, maxDepth = 16, className = '' }: RaidPropertyTreeProps) {
  const render = (item: unknown, path: string[], parents: readonly object[]): React.ReactNode => {
    const custom = renderValue?.(item, path);
    if (custom !== undefined) return custom;
    if (item === null || typeof item !== 'object') {
      return <span className="max-w-[48ch] whitespace-pre-wrap wrap-anywhere text-base-content">{item === null ? 'null' : String(item)}</span>;
    }
    if (parents.includes(item)) return <span className="text-base-content/60">Circular reference</span>;
    if (path.length >= maxDepth) return <span className="text-base-content/60">Disclosure depth limit reached</span>;
    const nextParents = [...parents, item];
    return <ul className="menu w-full min-w-0 p-1 text-xs">{Object.entries(item).map(([name, child]) => {
      const labelClass = projectedNames.includes(name) ? 'text-[#D4AF37] font-bold' : 'text-[#23231F]';
      const nextPath = [...path, name];
      return <li key={name} className="min-w-0">{child !== null && typeof child === 'object'
        ? <details><summary className={labelClass}>{name}</summary>{render(child, nextPath, nextParents)}</details>
        : <div className="flex flex-wrap items-start gap-2"><span className={labelClass}>{name}</span>{render(child, nextPath, nextParents)}</div>}</li>;
    })}</ul>;
  };
  return <div className={`raid-ui min-w-0 ${className}`}>{render(value, [], [])}</div>;
}

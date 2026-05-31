import { useState } from 'react';

interface CollapsibleCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleCard({ title, children, defaultOpen = false }: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`settings-card collapsible-card ${open ? 'collapsible-card--open' : ''}`}>
      <button className="collapsible-card__header" onClick={() => setOpen(o => !o)}>
        <span className="collapsible-card__title">{title}</span>
        <span className="collapsible-card__chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="collapsible-card__body">{children}</div>}
    </div>
  );
}

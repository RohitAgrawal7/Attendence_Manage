import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="border-b border-primary/10 bg-primary/5 px-4 py-2.5 sm:px-6">
      <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 text-sm">
        <li>
          <Link to="/" className="flex items-center text-primary transition-colors hover:text-primary-light">
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            {item.to ? (
              <Link to={item.to} className="font-medium text-primary hover:text-primary-light">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-primary">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

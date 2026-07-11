import { Pencil, Trash2 } from 'lucide-react';
import { Clock, BookOpen, Users, Trophy, Music } from 'lucide-react';
import type { Activity } from '../../types';
import { categoryColor } from '../../utils/stats';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: () => void;
  onDelete?: () => void;
}

function CategoryIcon({ category }: { category: string }) {
  const cls = 'h-5 w-5';
  switch (category.toLowerCase()) {
    case 'assembly':
      return <Users className={cls} />;
    case 'academic':
      return <BookOpen className={cls} />;
    case 'sports':
      return <Trophy className={cls} />;
    case 'cultural':
      return <Music className={cls} />;
    default:
      return <Clock className={cls} />;
  }
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const color = categoryColor(activity.category);

  return (
    <div className="card-shadow rounded-xl bg-white p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <CategoryIcon category={activity.category} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
            <span
              className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-xs"
              style={{ backgroundColor: `${color}14`, color }}
            >
              {activity.category}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{activity.description || 'No description'}</p>
          {activity.durationMinutes != null && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{activity.durationMinutes} min</span>
            </div>
          )}
        </div>
        {(onEdit || onDelete) && (
          <div className="flex shrink-0 flex-col gap-1.5">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent hover:bg-accent/20"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10 text-error hover:bg-error/20"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

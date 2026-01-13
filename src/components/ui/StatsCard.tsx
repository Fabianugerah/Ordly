import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
}: StatsCardProps) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-neutral-800">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${colors[color]} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
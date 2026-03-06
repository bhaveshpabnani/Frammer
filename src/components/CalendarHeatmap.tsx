import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DayData {
  date: string; // YYYY-MM-DD
  value: number;
}

interface CalendarHeatmapProps {
  data: DayData[];
  className?: string;
  label?: string;
  colorScheme?: 'red' | 'blue' | 'green';
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const COLOR_SCHEMES = {
  red: ['#1a0a0b', '#5c0f14', '#9b1a22', '#c4202a', '#E8212B'],
  blue: ['#0a0f1a', '#0f2a5c', '#1a3f9b', '#2050c4', '#3B82F6'],
  green: ['#0a1a0f', '#0f5c1a', '#1a9b30', '#20c440', '#22C55E'],
};

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  data,
  className,
  label = 'Videos processed',
  colorScheme = 'red',
}) => {
  const { weeks, monthLabels, maxValue } = useMemo(() => {
    if (data.length === 0) return { weeks: [], monthLabels: [], maxValue: 1 };

    const byDate = new Map(data.map((d) => [d.date, d.value]));
    const max = Math.max(...data.map((d) => d.value), 1);

    // Build week grid for last 52 weeks
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 363); // 52 weeks back
    // Align to Sunday
    start.setDate(start.getDate() - start.getDay());

    const allWeeks: Array<Array<{ date: string; value: number } | null>> = [];
    const months: Array<{ label: string; weekIndex: number }> = [];
    let lastMonth = -1;

    const cur = new Date(start);
    for (let w = 0; w < 52; w++) {
      const week: Array<{ date: string; value: number } | null> = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cur.toISOString().slice(0, 10);
        const m = cur.getMonth();
        if (m !== lastMonth) {
          months.push({ label: MONTHS[m], weekIndex: w });
          lastMonth = m;
        }
        week.push({ date: dateStr, value: byDate.get(dateStr) ?? 0 });
        cur.setDate(cur.getDate() + 1);
      }
      allWeeks.push(week);
    }

    return { weeks: allWeeks, monthLabels: months, maxValue: max };
  }, [data]);

  const colors = COLOR_SCHEMES[colorScheme];

  function getColor(value: number): string {
    if (value === 0) return '#161616';
    const normalized = value / maxValue;
    if (normalized < 0.2) return colors[1];
    if (normalized < 0.4) return colors[2];
    if (normalized < 0.7) return colors[3];
    return colors[4];
  }

  const [tooltip, setTooltip] = React.useState<{ date: string; value: number; x: number; y: number } | null>(null);

  return (
    <div className={cn('select-none', className)}>
      {/* Month labels */}
      <div className="relative h-5 mb-1 overflow-hidden">
        {monthLabels.map((m) => (
          <span
            key={`${m.label}-${m.weekIndex}`}
            className="absolute text-[10px] text-[#52525B]"
            style={{ left: m.weekIndex * 14 }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 justify-around">
          {DAYS.map((d, i) =>
            i % 2 === 1 ? (
              <span key={d} className="text-[9px] text-[#52525B] leading-none" style={{ height: 11 }}>
                {d}
              </span>
            ) : (
              <span key={d} className="text-[9px] text-transparent leading-none" style={{ height: 11 }}>
                {d}
              </span>
            )
          )}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day, di) => (
                <div
                  key={di}
                  onMouseEnter={(e) =>
                    day && setTooltip({ date: day.date, value: day.value, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  title={day ? `${day.date}: ${day.value} ${label}` : ''}
                  className="rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                  style={{ width: 11, height: 11, backgroundColor: day ? getColor(day.value) : '#111' }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] text-[#52525B]">Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{ width: 11, height: 11, backgroundColor: i === 0 ? '#161616' : colors[i] }}
          />
        ))}
        <span className="text-[10px] text-[#52525B]">More</span>
      </div>
    </div>
  );
};

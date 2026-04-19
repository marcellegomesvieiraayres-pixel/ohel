import React, { useState } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onDayClick: (day: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onTaskClick, onDayClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate && !task.targetDate) return false;
      const taskDate = new Date(task.dueDate || task.targetDate!);
      return isSameDay(taskDate, day);
    });
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Meu Calendário</h2>
            <p className="text-muted-foreground">Visualize e organize seus compromissos no tempo.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-muted/30 p-1 rounded-xl border">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold min-w-[140px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 border-none shadow-none bg-transparent overflow-hidden">
        <CardContent className="p-0 h-full flex flex-col">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b bg-muted/20">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 flex-1 border-l border-t">
            {calendarDays.map((day, idx) => {
              const dayTasks = getTasksForDay(day);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());

              return (
                <div 
                  key={idx} 
                  onClick={() => onDayClick(day)}
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b transition-colors flex flex-col gap-1 cursor-pointer",
                    !isCurrentMonth ? "bg-muted/5 opacity-30" : "bg-card/30 hover:bg-muted/10",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {format(day, 'd')}
                    </span>
                  </div>

                    <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      {dayTasks.map(task => {
                        const isNow = task.quadrant === 'urgent-important';
                        const isSchedule = task.quadrant === 'important-not-urgent';
                        const isDelegate = task.quadrant === 'urgent-not-important';

                        return (
                          <button
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className={cn(
                              "w-full text-left p-1.5 rounded-lg text-[10px] font-bold truncate border transition-all shadow-sm",
                              task.completed ? "bg-muted/50 text-muted-foreground line-through border-transparent" : 
                              isNow ? "bg-red-500/10 border-red-500/20 text-red-600 hover:bg-red-500/20" :
                              isSchedule ? "bg-blue-500/10 border-blue-500/20 text-blue-600 hover:bg-blue-500/20" :
                              isDelegate ? "bg-orange-500/10 border-orange-500/20 text-orange-600 hover:bg-orange-500/20" :
                              "bg-slate-500/10 border-slate-500/20 text-slate-600 hover:bg-slate-500/20"
                            )}
                          >
                            <div className="flex items-center gap-1">
                              <div className={cn(
                                "w-1 h-1 rounded-full shrink-0",
                                isNow ? "bg-red-500" : isSchedule ? "bg-blue-500" : isDelegate ? "bg-orange-500" : "bg-slate-500"
                              )} />
                              {task.title}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

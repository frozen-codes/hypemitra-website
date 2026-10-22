import React, { useState } from 'react';
import { PerformanceDayEntry, PerformanceRating, TaskItem } from '../types';
import { getMonthMatrix, formatISODate, MONTH_NAMES } from '../utils/dateUtils';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Clock,
  ListTodo,
  FileText,
  Sparkles,
} from 'lucide-react';

interface CreatorPerformanceCalendarProps {
  performance: Record<string, PerformanceDayEntry>;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  onSavePerformance: (entry: PerformanceDayEntry) => Promise<void>;
}

export const CreatorPerformanceCalendar: React.FC<CreatorPerformanceCalendarProps> = ({
  performance,
  selectedDate,
  onSelectDate,
  onSavePerformance,
}) => {
  // Calendar month state (defaults to current date)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthMatrix = getMonthMatrix(year, month);

  // Day editor state
  const currentEntry = performance[selectedDate];

  const [rating, setRating] = useState<PerformanceRating>(
    currentEntry?.performanceRating || 'green'
  );
  const [tasks, setTasks] = useState<TaskItem[]>(
    currentEntry?.tasks || []
  );
  const [newTaskInput, setNewTaskInput] = useState('');
  const [updates, setUpdates] = useState(
    currentEntry?.updates || ''
  );
  const [notes, setNotes] = useState(currentEntry?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync editor when selectedDate or performance changes
  React.useEffect(() => {
    const entry = performance[selectedDate];
    if (entry) {
      setRating(entry.performanceRating || 'green');
      setTasks(entry.tasks || []);
      setUpdates(entry.updates || '');
      setNotes(entry.notes || '');
    } else {
      setRating('green');
      setTasks([]);
      setUpdates('');
      setNotes('');
    }
    setSavedNotice(false);
  }, [selectedDate, performance]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    onSelectDate(formatISODate(now));
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    const newTask: TaskItem = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      text: newTaskInput.trim(),
      completed: false,
    };
    setTasks([...tasks, newTask]);
    setNewTaskInput('');
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(
      tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleRatingChange = async (newRating: PerformanceRating) => {
    setRating(newRating);
    // Instant save on rating change so the calendar dot updates automatically
    const updatedEntry: PerformanceDayEntry = {
      date: selectedDate,
      performanceRating: newRating,
      tasks,
      updates,
      notes,
      updatedAt: new Date().toISOString(),
    };
    try {
      await onSavePerformance(updatedEntry);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    const updatedEntry: PerformanceDayEntry = {
      date: selectedDate,
      performanceRating: rating,
      tasks,
      updates,
      notes,
      updatedAt: new Date().toISOString(),
    };
    try {
      await onSavePerformance(updatedEntry);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  // Format selected date
  const [selY, selM, selD] = selectedDate.split('-').map(Number);
  const selectedDateObj = new Date(selY, selM - 1, selD);
  const selectedFormatted = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Month Navigation & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CalendarIcon className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 font-serif">
              Creator Performance Calendar
            </h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Track daily creator deliverables, task execution, and work performance ratings
            </p>
          </div>
        </div>

        {/* Date Selector controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={month}
            onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value), 1))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 cursor-pointer"
          >
            {MONTH_NAMES.map((mName, idx) => (
              <option key={mName} value={idx}>
                {mName}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month, 1))}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-200 rounded-xl focus:ring-1 focus:ring-neutral-900 cursor-pointer"
          >
            {[-2, -1, 0, 1, 2].map((offset) => {
              const y = new Date().getFullYear() + offset;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl border border-neutral-200 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
        {/* Days of week header (Monday to Sunday) */}
        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold text-neutral-700">
          <div className="py-2.5 px-2 text-center">Mon</div>
          <div className="py-2.5 px-2 text-center">Tue</div>
          <div className="py-2.5 px-2 text-center">Wed</div>
          <div className="py-2.5 px-2 text-center">Thu</div>
          <div className="py-2.5 px-2 text-center">Fri</div>
          <div className="py-2.5 px-2 text-center">Sat</div>
          <div className="py-2.5 px-2 text-center">Sun</div>
        </div>

        {/* Days Matrix */}
        <div className="divide-y divide-neutral-200">
          {monthMatrix.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 divide-x divide-neutral-200">
              {week.map((date) => {
                const dateStr = formatISODate(date);
                const isCurrentMonth = date.getMonth() === month;
                const isSelected = selectedDate === dateStr;
                const entry = performance[dateStr];

                // Performance indicator dot color
                let dotColor = '';
                let dotLabel = '';
                if (entry) {
                  if (entry.performanceRating === 'green') {
                    dotColor = 'bg-emerald-500 shadow-xs ring-2 ring-emerald-200';
                    dotLabel = 'Best Work';
                  } else if (entry.performanceRating === 'yellow') {
                    dotColor = 'bg-amber-500 shadow-xs ring-2 ring-amber-200';
                    dotLabel = 'Average Work';
                  } else if (entry.performanceRating === 'red') {
                    dotColor = 'bg-rose-500 shadow-xs ring-2 ring-rose-200';
                    dotLabel = 'Poor Work';
                  }
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      if (isCurrentMonth) {
                        onSelectDate(dateStr);
                      }
                    }}
                    className={`h-16 sm:h-20 p-2 flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      !isCurrentMonth
                        ? 'bg-neutral-50/40 text-neutral-300 pointer-events-none'
                        : isSelected
                        ? 'ring-2 ring-neutral-900 bg-neutral-100 font-bold z-10'
                        : 'bg-white hover:bg-neutral-50/90 text-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <span
                        className={`text-sm font-mono ${
                          isSelected
                            ? 'font-bold text-neutral-900'
                            : isCurrentMonth
                            ? 'font-semibold text-neutral-800'
                            : 'text-neutral-300'
                        }`}
                      >
                        {date.getDate()}
                      </span>

                      {/* Colored performance dot */}
                      {entry ? (
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${dotColor}`}
                          title={`${dateStr}: ${dotLabel}`}
                        />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-transparent" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend bar: Green = Best Work, Yellow = Average Work, Red = Poor Work */}
        <div className="px-5 py-3 border-t border-neutral-200 bg-neutral-50/70 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-neutral-800">Performance Indicators:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span className="font-medium text-neutral-700">Green dot — Best Work</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
              <span className="font-medium text-neutral-700">Yellow dot — Average Work</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
              <span className="font-medium text-neutral-700">Red dot — Poor Work</span>
            </div>
          </div>
          <div className="text-[11px] text-neutral-500">
            Click any date or dot to view and edit details
          </div>
        </div>
      </div>

      {/* Selected Day Performance Details & Editor */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Day Header & Performance Rating Switcher */}
        <div className="p-5 border-b border-neutral-200 bg-neutral-50/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
              {selectedDateObj.getDate()}
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 font-serif">
                {selectedFormatted}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {currentEntry ? 'Recorded Performance Entry' : 'No performance logged yet for this date'}
              </p>
            </div>
          </div>

          {/* Performance Rating Radio Buttons (Instant dot update) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-neutral-700">Rating:</span>
            <button
              type="button"
              onClick={() => handleRatingChange('green')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                rating === 'green'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-800 border-neutral-200 hover:bg-emerald-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Best Work</span>
            </button>

            <button
              type="button"
              onClick={() => handleRatingChange('yellow')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                rating === 'yellow'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-amber-800 border-neutral-200 hover:bg-amber-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Average Work</span>
            </button>

            <button
              type="button"
              onClick={() => handleRatingChange('red')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                rating === 'red'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-rose-800 border-neutral-200 hover:bg-rose-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Poor Work</span>
            </button>
          </div>
        </div>

        {/* Day Tasks & Performance Content */}
        <div className="p-6 space-y-6">
          {/* Multiple Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <ListTodo className="w-4 h-4 text-neutral-700" />
                <span>Daily Tasks & Deliverables ({tasks.length})</span>
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                {tasks.filter((t) => t.completed).length}/{tasks.length} completed
              </span>
            </div>

            {/* Task Add Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Add a new task (e.g. Approve video draft for Nike, Send brief to 4 creators)..."
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
              />
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTaskInput.trim()}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Task list items */}
            {tasks.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/60 hover:bg-neutral-50 transition-colors text-xs"
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={!!task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                      />
                      <span
                        className={`${
                          task.completed
                            ? 'line-through text-neutral-400'
                            : 'text-neutral-800 font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                      title="Remove task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 italic py-2">
                No tasks added for this date yet. Use the input above to record tasks.
              </p>
            )}
          </div>

          {/* Daily Updates & Summary */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <FileText className="w-4 h-4 text-neutral-700" />
              <span>Daily Updates & Highlights</span>
            </label>
            <textarea
              rows={2}
              value={updates}
              onChange={(e) => setUpdates(e.target.value)}
              placeholder="Write summary updates on creator progress, client approvals, shoot milestones..."
              className="w-full p-3 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 leading-relaxed"
            />
          </div>

          {/* Extra Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-600">
              Additional Observations & Next Steps (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Follow up on courier seed kit delivery on Thursday"
              className="w-full px-3.5 py-2 text-xs bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50/60 flex items-center justify-between">
          <div>
            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Performance details saved</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Performance Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

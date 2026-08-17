import { CalendarDays, Clock, AlertCircle } from "lucide-react";

export interface OperationalTaskItem {
  id: string;
  text: string;
  time: string;
  urgent: boolean;
}

interface OperationalTasksCardProps {
  tasks: OperationalTaskItem[];
  title?: string;
}

export default function OperationalTasksCard({
  tasks,
  title = "Nhiệm vụ vận hành chi nhánh",
}: OperationalTasksCardProps) {
  return (
    <section className="rounded-none border border-gray-200 bg-white p-4 font-sans shadow-sm sm:p-5">
      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <CalendarDays size={18} className="text-primary-600" />
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-start gap-3 rounded-none border p-4 transition-colors ${
              task.urgent
                ? "border-orange-200 bg-orange-50/30 hover:bg-orange-50/55"
                : "border-gray-200 bg-gray-50/20 hover:bg-gray-50/50"
            }`}
          >
            {task.urgent ? (
              <AlertCircle className="text-orange-500 mt-0.5 shrink-0" size={16} />
            ) : (
              <Clock className="text-gray-400 mt-0.5 shrink-0" size={16} />
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium">{task.text}</p>
              <span
                className={`text-[10px] font-bold uppercase mt-1 inline-block ${
                  task.urgent ? "text-orange-600" : "text-gray-400"
                }`}
              >
                {task.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

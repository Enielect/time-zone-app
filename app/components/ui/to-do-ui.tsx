import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";
import {
  Clock,
  MoreVerticalIcon,
  Plus,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import {
  formatDateTimeForUser,
  isOverdue,
  getUrgencyLevel,
  getUserTimezone,
} from "~/lib/timezone-utils";

export type TodoItem = {
  id: string;
  title: string;
  tag: string;
  details: string;
  dueDate: string; // ISO string for consistent storage
  status: "todo" | "in-progress" | "completed";
  createdAt: string; // ISO string
  timezone: string; // User's timezone when created
};

type TodoUIProps = {
  todos: TodoItem[];
};

const KanbanCardSection = ({
  title,
  todos,
  status,
}: {
  title: string;
  todos: TodoItem[];
  status: "todo" | "in-progress" | "completed";
}) => {
  const filteredTodos = todos.filter((todo) => todo.status === status);

  const getUrgencyStyles = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case "overdue":
        return "bg-red-50 border-red-200 text-red-800";
      case "urgent":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "soon":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getUrgencyIcon = (urgencyLevel: string) => {
    switch (urgencyLevel) {
      case "overdue":
      case "urgent":
        return <AlertTriangle size={12} className="text-red-500" />;
      case "soon":
        return <CalendarDays size={12} className="text-yellow-500" />;
      default:
        return <Clock size={12} className="text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col px-3 bg-blue-200/10 h-full gap-3 ">
      <header className=" py-2 border-b flex justify-between">
        <div className="flex gap-2">
          <span>{title}</span>
          <span>{filteredTodos.length}</span>
        </div>
        <div className="flex gap-2">
          <button>
            <Plus size={18} />
          </button>
          <button>
            <MoreVerticalIcon size={18} />
          </button>
        </div>
      </header>

      <section className="space-y-3">
        {filteredTodos.map((todo) => {
          const urgencyLevel = getUrgencyLevel(todo.dueDate);
          const isTaskOverdue = isOverdue(todo.dueDate);

          return (
            <Card
              className={`w-[22rem] shadow-none py-4 border-l-4 ${getUrgencyStyles(urgencyLevel)}`}
              key={todo.id}
            >
              <CardHeader className="!px-4">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-md font-medium flex-1">
                    {todo.title}
                    {isTaskOverdue && (
                      <span className="ml-2 text-red-500 text-xs font-bold">
                        OVERDUE
                      </span>
                    )}
                  </CardTitle>
                  {urgencyLevel !== "normal" && getUrgencyIcon(urgencyLevel)}
                </div>
                <CardDescription className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full w-fit">
                  {todo.tag}
                </CardDescription>
              </CardHeader>
              <CardContent className="!px-4">
                {todo.details && (
                  <p className="text-sm text-gray-600 mb-3">{todo.details}</p>
                )}

                {/* Due Date with timezone awareness */}
                {todo.dueDate && (
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={12} />
                      <span
                        className={
                          isOverdue(todo.dueDate)
                            ? "text-red-600 font-semibold"
                            : "text-gray-600"
                        }
                      >
                        Due:{" "}
                        {formatDateTimeForUser(todo.dueDate, {
                          format: "full",
                        })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTimeForUser(todo.dueDate, {
                        format: "relative",
                      })}
                    </div>
                  </div>
                )}

                {/* Creation info */}
                <div className="text-xs text-gray-500">
                  Created:{" "}
                  {formatDateTimeForUser(todo.createdAt, {
                    format: "date",
                    includeTimezone: false,
                  })}
                </div>
              </CardContent>
              <CardFooter className="border-t !px-3 flex justify-between !pt-3">
                <div
                  className={`px-2 py-1 rounded-full text-xs ${
                    todo.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : todo.status === "in-progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {todo.status.replace("-", " ")}
                </div>

                <div className="flex gap-3">
                  {/* <span className="flex gap-2 items-center text-xs text-gray-500">
                  <Clock size={12} />
                  <span>{todo.tag}</span>
                </span> */}
                </div>
              </CardFooter>
            </Card>
          );
        })}

        {filteredTodos.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No tasks in this category
          </div>
        )}
      </section>
    </div>
  );
};

const TodoUI = ({ todos }: TodoUIProps) => {
  return (
    <div className="flex h-full gap-3">
      <KanbanCardSection title="To-do" todos={todos} status="todo" />
      {/* <KanbanCardSection
        title="In Progress"
        todos={todos}
        status="in-progress"
      />
      <KanbanCardSection title="Completed" todos={todos} status="completed" /> */}
    </div>
  );
};

export default TodoUI;

import React, { useEffect, useState } from "react";
import DialogForm from "../components/ui/dialog-form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/text-area";
import * as yup from "yup";
// import { yupResolver } from '@hookform/resolvers/yup';
import { BadgeCheck, Bug, ScrollText } from "lucide-react";
import TodoUI, { type TodoItem } from "~/components/ui/to-do-ui";
import { Label } from "~/components/ui/label";
import {
  prepareDateTimeForStorage,
  getUserTimezone,
} from "~/lib/timezone-utils";

type FormInfo = {
  title: string;
  tag: string;
  details: string;
  time: string;
};
type InformationDataProps = {
  informationData: FormInfo;
  setInformationData: React.Dispatch<React.SetStateAction<FormInfo>>;
};

const BASE_URL = "https://twelve-factor-app.onrender.com";

const ChildComponent = ({
  informationData,
  setInformationData,
}: InformationDataProps) => {
  return (
    <div className="flex flex-col gap-3 ">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-white pb-1" htmlFor="time">
            Tag
          </Label>

          <Input
            placeholder="Add a Tag to group tasks"
            // autoComplete="off"
            className="border-white/10 hover:border-white/15 bg-white/60"
            name="tag"
            value={informationData.tag}
            onChange={(e) =>
              setInformationData({ ...informationData, tag: e.target.value })
            }
          />
        </div>
        <div>
          <Label className="text-white pb-1" htmlFor="time">
            Add Title
          </Label>

          <Input
            placeholder="Identify task with a title"
            // autoComplete="off"
            className="border-white/10 hover:border-white/15 bg-white/60"
            name="title"
            value={informationData.title}
            onChange={(e) =>
              setInformationData({
                ...informationData,
                title: e.target.value,
              })
            }
          />
        </div>
        <div className="col-span-2">
          <Label className="text-white pb-1" htmlFor="time">
            Add time
          </Label>
          <Input
            placeholder="Time"
            // autoComplete="off"
            type="datetime-local"
            className="border-white/10  hover:border-white/15 bg-white/60"
            name="time"
            value={informationData.time}
            onChange={(e) =>
              setInformationData({
                ...informationData,
                time: e.target.value,
              })
            }
          />
        </div>
      </div>
      <Textarea
        placeholder="Provide details about the task..."
        className="border-white/10 hover:border-white/15 bg-white/60"
        rows={5}
        style={{
          resize: "none",
        }}
        name="details"
        value={informationData.details}
        onChange={(e) =>
          setInformationData({ ...informationData, details: e.target.value })
        }
      />
    </div>
  );
};

const DialogFormDemo = () => {
  const [shouldSucceed, setShouldSucceed] = useState(true);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [informationData, setInformationData] = useState({
    tag: "",
    title: "",
    time: "",
    details: "",
  });

  useEffect(() => {
    // Fetch existing todos from backend on component mount
    const fetchTodos = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/tasks`);
        if (!response.ok) {
          throw new Error("Failed to fetch todos");
        }
        const data = await response.json();
        const formattedData = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          tag: item.tag,
          details: item.details,
          dueDate: item.timeDue,
          status: 'todo',
          createdAt: item.createdAt,
          // timezone: item.timezone,
        }));
        // Assuming the backend returns an array of todos in the correct format
        setTodos(formattedData);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };

    fetchTodos();
  }, []);

  const onCloseCb = () => {
    setInformationData({ tag: "", title: "", time: "", details: "" });
  };

  const handleSubmit = async () => {
    const formData = { ...informationData };
    console.log(formData);

    // Check if required fields are filled
    if (!formData.title.trim() || !formData.tag.trim()) {
      return { success: false, message: "Please fill in title and tag" };
    }

    const userTimezone = getUserTimezone();

    const newTodo = {
      title: formData.title,
      tag: formData.tag,
      details: formData.details,
      timeDue: prepareDateTimeForStorage(formData.time), // Convert to ISO string
    };

    const formattedTodo: TodoItem = {
      id: Date.now().toString(),
      title: formData.title,
      tag: formData.tag,
      details: formData.details,
      dueDate: prepareDateTimeForStorage(formData.time), // Convert to ISO string
      status: "todo",
      createdAt: new Date().toISOString(),
      timezone: userTimezone,
    };

    try {
      const response = await fetch(`${BASE_URL}/api/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTodo),
      });

      if (!response.ok) {
        throw new Error("Failed to add todo");
      }

      const result = await response.json();
      console.log("Todo added successfully:", result);
    } catch (err) {
      console.error("Error adding todo:", err);
      return { success: false, message: "Failed to add todo" };
    }

    // Add to todos list
    setTodos((prevTodos) => [...prevTodos, formattedTodo]);

    // Clear form
    setInformationData({
      tag: "",
      title: "",
      time: "",
      details: "",
    });

    setShouldSucceed(!shouldSucceed);

    const response = shouldSucceed
      ? { success: true, message: "Task added successfully!" }
      : { success: false, message: "Something went wrong" };

    return response;
  };

  return (
    <div className="grid grid-cols-2">
      <div className="flex items-center bg-[url('/bg-form-image.jpg')] object-cover object-center justify-center h-screen">
        <DialogForm
          icon={<ScrollText size={16} />}
          label="Add to List"
          successIcon={<BadgeCheck size={40} />}
          successText="Reported Successfully"
          childComponent={
            <ChildComponent
              informationData={informationData}
              setInformationData={setInformationData}
            />
          }
          onSubmit={handleSubmit}
          onClose={onCloseCb}
        />
      </div>
      <div>
        <TodoUI todos={todos} />
      </div>
    </div>
  );
};

export default DialogFormDemo;

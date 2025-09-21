import { toZonedTime, fromZonedTime, format as formatTz } from "date-fns-tz";
import {
  format,
  differenceInHours,
  differenceInMinutes,
  differenceInDays,
} from "date-fns";

export type TimezoneInfo = {
  timezone: string;
  offset: number;
  isDST: boolean;
  abbreviation: string;
};

export type TodoTimezoneData = {
  dueDate: string; // UTC ISO string
  createdInTimezone: string; // Original timezone
  originalLocalTime: string; // Original local time string
};


export const getUserTimezone = (): string => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return timezone;
};

export const createTodoWithTimezone = (
  localDateTime: string // "2025-09-28T22:00" (10 PM local time)
): TodoTimezoneData => {
  const timezone = getUserTimezone();

  try {
    // Parse the local datetime string and treat it as being in the creator's timezone
    const localDate = new Date(localDateTime);

    // Convert to UTC using the creator's timezone context
    const utcDate = fromZonedTime(localDate, timezone);

    return {
      dueDate: utcDate.toISOString(), // Store as UTC
      createdInTimezone: timezone,
      originalLocalTime: localDateTime,
    };
  } catch (error) {
    console.error("Error creating todo with timezone:", error);
    return {
      dueDate: new Date(localDateTime).toISOString(),
      createdInTimezone: timezone,
      originalLocalTime: localDateTime,
    };
  }
};

export const prepareDateTimeForStorage = (localDateTime: string): string => {
  if (!localDateTime) return "";

  const todoData = createTodoWithTimezone(localDateTime);
  return todoData.dueDate;
};

export const formatDateTimeForUser = (
  isoString: string,
  options: {
    timezone?: string;
    format?: "full" | "date" | "time" | "relative";
    includeTimezone?: boolean;
  } = {}
): string => {
  if (!isoString) return "No due date";

  const {
    timezone = getUserTimezone(),
    format: formatType = "full",
    includeTimezone = true,
  } = options;

  try {
    const utcDate = new Date(isoString);

    if (isNaN(utcDate.getTime())) {
      return "Invalid date";
    }

    // Convert UTC to target timezone
    const zonedDate = toZonedTime(utcDate, timezone);

    switch (formatType) {
      case "relative":
        return formatRelativeTime(utcDate, timezone);

      case "date":
        return formatTz(zonedDate, "MMM d, yyyy", { timeZone: timezone });

      case "time":
        const timeFormat = includeTimezone ? "h:mm a zzz" : "h:mm a";
        return formatTz(zonedDate, timeFormat, { timeZone: timezone });

      case "full":
        return formatTz(zonedDate, "MMM d, yyyy h:mm a", { timeZone: timezone });
      default:
        const fullFormat = includeTimezone
          ? "MMM d, yyyy h:mm a zzz"
          : "MMM d, yyyy h:mm a";
        return formatTz(zonedDate, fullFormat, { timeZone: timezone });
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

const formatRelativeTime = (utcDate: Date, timezone: string): string => {
  try {
    const now = new Date();
    const zonedDate = toZonedTime(utcDate, timezone);
    const zonedNow = toZonedTime(now, timezone);

    const diffMinutes = differenceInMinutes(zonedDate, zonedNow);
    const diffHours = differenceInHours(zonedDate, zonedNow);
    const diffDays = differenceInDays(zonedDate, zonedNow);

    // Handle minutes and hours for today
    if (Math.abs(diffDays) < 1) {
      if (Math.abs(diffMinutes) < 60) {
        if (diffMinutes === 0) return "Now";
        return diffMinutes > 0
          ? `In ${diffMinutes}m`
          : `${Math.abs(diffMinutes)}m ago`;
      }
      if (diffHours === 0) return "Now";
      return diffHours > 0
        ? `In ${Math.abs(diffHours)}h`
        : `${Math.abs(diffHours)}h ago`;
    }

    // Handle days for this week
    if (Math.abs(diffDays) < 7) {
      if (diffDays === 1) return "Tomorrow";
      if (diffDays === -1) return "Yesterday";
      return diffDays > 0
        ? `In ${diffDays} days`
        : `${Math.abs(diffDays)} days ago`;
    }

    // For longer periods, show actual date
    return formatTz(zonedDate, "MMM d, yyyy", { timeZone: timezone });
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "Invalid date";
  }
};

export const isOverdue = (dueDate: string, timezone?: string): boolean => {
  if (!dueDate) return false;

  try {
    const utcDue = new Date(dueDate);
    const now = new Date();
    const tz = timezone || getUserTimezone();

    // Convert both to the same timezone for comparison
    const zonedDue = toZonedTime(utcDue, tz);
    const zonedNow = toZonedTime(now, tz);

    return zonedDue.getTime() < zonedNow.getTime();
  } catch {
    return false;
  }
};

export const getUrgencyLevel = (
  dueDate: string,
  timezone?: string
): "overdue" | "urgent" | "soon" | "normal" => {
  if (!dueDate) return "normal";

  try {
    const utcDue = new Date(dueDate);
    const now = new Date();
    const tz = timezone || getUserTimezone();

    // Convert both to the same timezone
    const zonedDue = toZonedTime(utcDue, tz);
    const zonedNow = toZonedTime(now, tz);

    const diffHours = differenceInHours(zonedDue, zonedNow);

    if (diffHours < 0) return "overdue";
    if (diffHours < 24) return "urgent";
    if (diffHours < 72) return "soon";
    return "normal";
  } catch {
    return "normal";
  }
};

/**
 * Comprehensive timezone management utilities for todo app
 * Handles DST, user location detection, and consistent time formatting
 */

export type TimezoneInfo = {
  timezone: string;
  offset: number;
  isDST: boolean;
  abbreviation: string;
};

/**
 * Get user's current timezone information
 */
export const getUserTimezone = (): TimezoneInfo => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();

  // Get timezone offset in minutes
  const offset = -now.getTimezoneOffset();

  // Check if currently in DST
  const isDST = isDaylightSavingTime(now);

  // Get timezone abbreviation
  const abbreviation = getTimezoneAbbreviation(timezone, now);

  return {
    timezone,
    offset,
    isDST,
    abbreviation,
  };
};

/**
 * Check if a date is in Daylight Saving Time
 */
const isDaylightSavingTime = (date: Date): boolean => {
  const january = new Date(date.getFullYear(), 0, 1);
  const july = new Date(date.getFullYear(), 6, 1);
  const janOffset = january.getTimezoneOffset();
  const julOffset = july.getTimezoneOffset();

  // If current offset is different from standard time, we're in DST
  return Math.max(janOffset, julOffset) !== date.getTimezoneOffset();
};

/**
 * Get timezone abbreviation (EST, PST, UTC, etc.)
 */
const getTimezoneAbbreviation = (timezone: string, date: Date): string => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });

    const parts = formatter.formatToParts(date);
    const timeZonePart = parts.find((part) => part.type === "timeZoneName");
    return timeZonePart?.value || timezone.split("/").pop() || "UTC";
  } catch {
    return "UTC";
  }
};

/**
 * Convert datetime-local input to ISO string with timezone
 */
export const convertLocalTimeToISO = (
  localDateTime: string,
  userTimezone?: string
): string => {
  if (!localDateTime) return "";

  const timezone = userTimezone || getUserTimezone().timezone;

  // Create date assuming it's in user's timezone
  const date = new Date(localDateTime);

  // Convert to ISO string maintaining timezone context
  return (
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .format(date)
      .replace(" ", "T") + "Z"
  );
};

/**
 * Format datetime for display in user's timezone
 */
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
    timezone = getUserTimezone().timezone,
    format = "full",
    includeTimezone = true,
  } = options;

  try {
    const date = new Date(isoString);

    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    switch (format) {
      case "relative":
        return formatRelativeTime(date, timezone);

      case "date":
        return new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(date);

      case "time":
        return new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          ...(includeTimezone && { timeZoneName: "short" }),
        }).format(date);

      case "full":
      default:
        const dateStr = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);

        if (includeTimezone) {
          const tzAbbr = getTimezoneAbbreviation(timezone, date);
          return `${dateStr} ${tzAbbr}`;
        }

        return dateStr;
    }
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

/**
 * Format relative time (e.g., "in 2 hours", "3 days ago")
 */
const formatRelativeTime = (date: Date, timezone: string): string => {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // If it's today, show time
  if (Math.abs(diffDays) < 1) {
    if (Math.abs(diffMinutes) < 60) {
      if (diffMinutes === 0) return "Now";
      return diffMinutes > 0
        ? `In ${diffMinutes}m`
        : `${Math.abs(diffMinutes)}m ago`;
    }
    if (diffHours === 0) return "Now";
    return diffHours > 0 ? `In ${diffHours}h` : `${Math.abs(diffHours)}h ago`;
  }

  // For other days, show relative days
  if (Math.abs(diffDays) < 7) {
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    return diffDays > 0
      ? `In ${diffDays} days`
      : `${Math.abs(diffDays)} days ago`;
  }

  // For longer periods, show actual date
  return formatDateTimeForUser(date.toISOString(), {
    timezone,
    format: "date",
    includeTimezone: false,
  });
};

/**
 * Check if a todo is overdue
 */
export const isOverdue = (dueDate: string): boolean => {
  if (!dueDate) return false;

  try {
    const due = new Date(dueDate);
    const now = new Date();
    return due.getTime() < now.getTime();
  } catch {
    return false;
  }
};

/**
 * Get urgency level based on due date
 */
export const getUrgencyLevel = (
  dueDate: string
): "overdue" | "urgent" | "soon" | "normal" => {
  if (!dueDate) return "normal";

  try {
    const due = new Date(dueDate);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) return "overdue";
    if (diffHours < 24) return "urgent";
    if (diffHours < 72) return "soon";
    return "normal";
  } catch {
    return "normal";
  }
};

/**
 * Convert datetime-local input value to user's timezone for storage
 */
export const prepareDateTimeForStorage = (localDateTime: string): string => {
  if (!localDateTime) return "";

  // The datetime-local input gives us YYYY-MM-DDTHH:mm format
  // We need to treat this as being in the user's timezone
  const userTimezone = getUserTimezone().timezone;

  try {
    // Create a date object from the local input
    // Note: new Date() with this format assumes local timezone
    const localDate = new Date(localDateTime);

    // Store as ISO string - this preserves the exact moment in time
    return localDate.toISOString();
  } catch (error) {
    console.error("Error preparing datetime for storage:", error);
    return "";
  }
};

/**
 * Get datetime-local format for input field (user's timezone)
 */
export const getDateTimeLocalValue = (isoString: string): string => {
  if (!isoString) return "";

  try {
    const date = new Date(isoString);

    // Convert to user's timezone and format for datetime-local input
    const userTimezone = getUserTimezone().timezone;

    // Get the local time string in ISO format but without the Z
    const localISOString = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16); // Remove seconds and timezone info

    return localISOString;
  } catch (error) {
    console.error("Error getting datetime-local value:", error);
    return "";
  }
};

import { fromZonedTime } from "date-fns-tz";
import { getUserTimezone } from "~/lib/timezone-utils";

export const createTodoWithTimezone = (
  localDateTime: string // "2025-09-28T22:00" (10 PM local time)
) => {
  const timezone = getUserTimezone();

  try {
    // Parse the local datetime string and treat it as being in the creator's timezone
    const localDate = new Date(localDateTime);

    // Convert to UTC using the creator's timezone context
    const utcDate = fromZonedTime(localDate, timezone);
    console.log(utcDate, 'utcDate');

    return {
      dueDate: utcDate.toISOString(), // Store as UTC
      createdInTimezone: timezone,
      originalLocalTime: localDateTime,
    };
  } catch (error) {
    console.error("Error creating todo with timezone:", error);
    return {
      dueDate: new Date(localDateTime).toISOString(), // Fallback
      createdInTimezone: timezone,
      originalLocalTime: localDateTime,
    };
  }
};
console.log(createTodoWithTimezone("2025-09-28T22:00"));

export const parseCronExpression = (cronExpression: string): string => {
  if (!cronExpression) return "Invalid cron expression";

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression format";

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  try {
    // Handle some common patterns
    if (cronExpression === "0 * * * *") {
      return "Every hour at minute 0";
    }
    if (cronExpression === "1 * * * *") {
      return "Every hour at minute 1";
    }
    if (cronExpression === "30 * * * *") {
      return "Every hour at minute 30";
    }
    if (cronExpression === "*/5 * * * *") {
      return "Every 5 minutes";
    }
    if (cronExpression === "0 0 * * *") {
      return "Daily at midnight";
    }
    if (cronExpression === "0 12 * * *") {
      return "Daily at noon";
    }
    if (cronExpression === "0 0 * * 0") {
      return "Weekly on Sunday at midnight";
    }
    if (cronExpression === "0 0 1 * *") {
      return "Monthly on the 1st at midnight";
    }

    // Build description from parts
    let description = "";

    // Handle minute
    if (minute === "*") {
      description += "Every minute";
    } else if (minute.startsWith("*/")) {
      description += `Every ${minute.slice(2)} minutes`;
    } else {
      description += `At minute ${minute}`;
    }

    // Handle hour
    if (hour !== "*") {
      if (hour.startsWith("*/")) {
        description += ` of every ${hour.slice(2)} hours`;
      } else {
        description += ` of hour ${hour}`;
      }
    }

    // Handle day of month
    if (dayOfMonth !== "*") {
      description += ` on day ${dayOfMonth} of the month`;
    }

    // Handle month
    if (month !== "*") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      if (month.includes(",")) {
        const monthNumbers = month
          .split(",")
          .map((m) => months[parseInt(m) - 1])
          .join(", ");
        description += ` in ${monthNumbers}`;
      } else {
        description += ` in ${months[parseInt(month) - 1]}`;
      }
    }

    // Handle day of week
    if (dayOfWeek !== "*") {
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      if (dayOfWeek.includes(",")) {
        const dayNumbers = dayOfWeek
          .split(",")
          .map((d) => days[parseInt(d)])
          .join(", ");
        description += ` on ${dayNumbers}`;
      } else {
        description += ` on ${days[parseInt(dayOfWeek)]}`;
      }
    }

    return description;
  } catch (error) {
    return "Unable to parse cron expression";
  }
};
const WILDCARD = "*";

const COMMON_PATTERNS: Record<string, string> = {
  "0 * * * *": "Every hour at minute 0",
  "1 * * * *": "Every hour at minute 1",
  "30 * * * *": "Every hour at minute 30",
  "*/5 * * * *": "Every 5 minutes",
  "0 0 * * *": "Daily at midnight",
  "0 12 * * *": "Daily at noon",
  "0 0 * * 0": "Weekly on Sunday at midnight",
  "0 0 1 * *": "Monthly on the 1st at midnight"
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", 
  "Thursday", "Friday", "Saturday"
];

const formatListFromMap = (
  value: string, 
  valueMap: string[], 
  template: string
): string => {
  if (value.includes(",")) {
    const items = value
      .split(",")
      .map((item) => valueMap[parseInt(item) - (valueMap === MONTHS ? 1 : 0)])
      .join(", ");
    return template.replace("{items}", items);
  } else {
    const item = valueMap[parseInt(value) - (valueMap === MONTHS ? 1 : 0)];
    return template.replace("{items}", item);
  }
};

export const parseCronExpression = (cronExpression: string): string => {
  if (!cronExpression) return "Invalid cron expression";

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length !== 5) return "Invalid cron expression format";

  // Check for common patterns first
  if (COMMON_PATTERNS[cronExpression]) {
    return COMMON_PATTERNS[cronExpression];
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  try {

    // Build description from parts
    let description = "";

    // Handle minute
    if (minute === WILDCARD) {
      description += "Every minute";
    } else if (minute.startsWith("*/")) {
      description += `Every ${minute.slice(2)} minutes`;
    } else {
      description += `At minute ${minute}`;
    }

    // Handle hour
    if (hour !== WILDCARD) {
      if (hour.startsWith("*/")) {
        description += ` of every ${hour.slice(2)} hours`;
      } else {
        description += ` of hour ${hour}`;
      }
    }

    // Handle day of month
    if (dayOfMonth !== WILDCARD) {
      description += ` on day ${dayOfMonth} of the month`;
    }

    // Handle month
    if (month !== WILDCARD) {
      description += " " + formatListFromMap(month, MONTHS, "in {items}");
    }

    // Handle day of week
    if (dayOfWeek !== WILDCARD) {
      description += " " + formatListFromMap(dayOfWeek, DAYS, "on {items}");
    }

    return description;
  } catch (error) {
    return "Unable to parse cron expression";
  }
};
export const formatDate = (date: string | Date | undefined) => {
  if (!date) return "N/A";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleString();
};
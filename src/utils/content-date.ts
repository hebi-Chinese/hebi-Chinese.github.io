const CONTENT_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
};

export const formatContentDate = (date: Date) => date.toLocaleDateString('zh-CN', CONTENT_DATE_FORMAT);

export const toContentDate = (date: Date) => date.toISOString().slice(0, 10);

export const formatContentTimestamp = (date: Date, time?: string) => {
  const formattedDate = formatContentDate(date);
  return time ? `${formattedDate} · ${time}` : formattedDate;
};

export const toContentDateTime = (date: Date, time?: string) => {
  const datePart = toContentDate(date);
  return time ? `${datePart}T${time}:00` : datePart;
};

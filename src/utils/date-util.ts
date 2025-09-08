/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @param format 格式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | number | string,
  format = 'YYYY-MM-DD HH:mm:ss'
): string {
  if (!date) return '';
  
  let d: Date;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'number') {
    d = new Date(date);
  } else {
    d = new Date(date);
    if (isNaN(d.getTime())) {
      return String(date);
    }
  }

  const padZero = (num: number, len = 2): string => {
    return String(num).padStart(len, '0');
  };

  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();
  const second = d.getSeconds();

  return format
    .replace(/YYYY/g, String(year))
    .replace(/YY/g, String(year).slice(-2))
    .replace(/MM/g, padZero(month))
    .replace(/DD/g, padZero(day))
    .replace(/HH/g, padZero(hour))
    .replace(/mm/g, padZero(minute))
    .replace(/ss/g, padZero(second));
}

/**
 * 获取相对时间
 * @param time 时间戳或日期字符串
 * @returns 相对时间描述
 */
export function formatRelativeTime(time: Date | number | string): string {
  const now = new Date();
  const target = time instanceof Date ? time : new Date(time);
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

  const minute = 60;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diffInSeconds < 0) {
    return '刚刚';
  } else if (diffInSeconds < minute) {
    return `${diffInSeconds}秒前`;
  } else if (diffInSeconds < hour) {
    return `${Math.floor(diffInSeconds / minute)}分钟前`;
  } else if (diffInSeconds < day) {
    return `${Math.floor(diffInSeconds / hour)}小时前`;
  } else if (diffInSeconds < month) {
    return `${Math.floor(diffInSeconds / day)}天前`;
  } else if (diffInSeconds < year) {
    return `${Math.floor(diffInSeconds / month)}个月前`;
  } else {
    return `${Math.floor(diffInSeconds / year)}年前`;
  }
}

/**
 * 获取日期的开始时间（00:00:00）
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 获取日期的结束时间（23:59:59.999）
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * 获取两个日期之间的天数
 */
export function getDaysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 日期加减
 * @param date 日期
 * @param days 天数，可以为负数
 * @returns 新的日期对象
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default {
  formatDate,
  formatRelativeTime,
  getStartOfDay,
  getEndOfDay,
  getDaysBetween,
  addDays,
};

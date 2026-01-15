
/**
 * Time Utility for Personal Net Worth Tracker
 * Handles strict WIB (UTC+7) timezone logic for auto-locking.
 */

const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Returns the current Date object adjusted to WIB/Jakarta Time.
 * Note: This returns a JS Date object where the "local" getters (getHours etc) 
 * might still reflect system time if not handled carefully. 
 * Best to use Intl for formatting strings.
 */
export const getNowWIB = () => {
    return new Date().toLocaleString('en-US', { timeZone: WIB_TIMEZONE });
};

/**
 * Returns the current Date object, but "shifted" so that .getUTC* methods 
 * return WIB time. Useful for timestamp generation.
 */
export const getWIBDate = () => {
    const now = new Date();
    // Get the localized string for Jakarta
    const jakartaStr = now.toLocaleString("en-US", { timeZone: WIB_TIMEZONE });
    return new Date(jakartaStr);
};

export const formatDateWIB = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: WIB_TIMEZONE,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    }).format(new Date(date));
};

export const isEndOfMonthWIB = () => {
    const now = getWIBDate();
    const currentMonth = now.getMonth(); // 0-11

    // Create a date for "tomorrow" in WIB context
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // If tomorrow is next month, then today is the last day of the month
    const isLastDay = tomorrow.getMonth() !== currentMonth;

    // Check if time is 23:59 (simple check for "near midnight")
    const isLate = now.getHours() === 23 && now.getMinutes() >= 59;

    return isLastDay && isLate;
};

export const getMonthName = (monthIndex) => {
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return months[monthIndex];
};

export const applyTimeRounding = (minutes, client) => {
  if (!client || !client.time_rounding_increment || client.time_rounding_increment === "none") {
    return minutes;
  }
  
  const increment = client.time_rounding_increment;
  const direction = client.time_rounding_direction;
  
  let roundingMinutes;
  switch (increment) {
    case "15_min": roundingMinutes = 15; break;
    case "30_min": roundingMinutes = 30; break;
    case "1_hour": roundingMinutes = 60; break;
    default: return minutes;
  }
  
  // This logic ensures that if the time is already an exact multiple of the increment, it doesn't change.
  // For rounding up, we only round up if it's not an exact multiple.
  const isExactMultiple = minutes % roundingMinutes === 0;

  switch (direction) {
    case "up":
      return isExactMultiple ? minutes : Math.ceil(minutes / roundingMinutes) * roundingMinutes;
    case "down":
      return Math.floor(minutes / roundingMinutes) * roundingMinutes;
    case "nearest":
      return Math.round(minutes / roundingMinutes) * roundingMinutes;
    default:
      return minutes;
  }
};
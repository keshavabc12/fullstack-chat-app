export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ✅ Format date for message separators
export function formatMessageDate(date) {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if it's today
  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  }
  
  // Check if it's yesterday
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // Check if it's this week
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (messageDate > weekAgo) {
    return messageDate.toLocaleDateString("en-US", { weekday: "long" });
  }
  
  // Check if it's this year
  if (messageDate.getFullYear() === today.getFullYear()) {
    return messageDate.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric" 
    });
  }
  
  // Older than this year
  return messageDate.toLocaleDateString("en-US", { 
    year: "numeric",
    month: "long", 
    day: "numeric" 
  });
}

// ✅ Check if two dates are on different days
export function isDifferentDay(date1, date2) {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.toDateString() !== d2.toDateString();
}

// ✅ Check if two dates are within the same hour
export function isSameHour(date1, date2) {
  if (!date1 || !date2) return false;
  
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return d1.getHours() === d2.getHours() && 
         d1.toDateString() === d2.toDateString();
}

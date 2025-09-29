// Utility functions for formatting

export function formatCurrency(amount: number, currency = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-KE").format(num);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
}

export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i];
}

export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  
  // Format Kenyan phone numbers
  if (cleaned.startsWith("254") && cleaned.length === 12) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith("0") && cleaned.length === 10) {
    return `+254 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  } else if (cleaned.startsWith("7") && cleaned.length === 9) {
    return `+254 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone; // Return original if not Kenyan format
}

export function formatCreditScore(score: number): { grade: string; color: string; label: string } {
  if (score >= 800) {
    return { grade: "A+", color: "text-green-600", label: "Excellent" };
  } else if (score >= 740) {
    return { grade: "A", color: "text-green-600", label: "Very Good" };
  } else if (score >= 670) {
    return { grade: "B", color: "text-blue-600", label: "Good" };
  } else if (score >= 580) {
    return { grade: "C", color: "text-yellow-600", label: "Fair" };
  } else if (score >= 300) {
    return { grade: "D", color: "text-red-600", label: "Poor" };
  } else {
    return { grade: "F", color: "text-red-800", label: "Very Poor" };
  }
}

export function formatDuration(months: number): string {
  if (months === 1) {
    return "1 month";
  } else if (months < 12) {
    return `${months} months`;
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (remainingMonths === 0) {
      return `${years} year${years > 1 ? "s" : ""}`;
    } else {
      return `${years} year${years > 1 ? "s" : ""} ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
    }
  }
}

export function formatAddress(address: string, length = 6): string {
  if (address.length <= length * 2 + 2) {
    return address;
  }
  
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

export function formatHash(hash: string, length = 6): string {
  return formatAddress(hash, length);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - 3) + "...";
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => capitalizeFirst(word))
    .join(" ");
}

export function formatInterestRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export function formatLoanStatus(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "text-yellow-600" },
    approved: { label: "Approved", color: "text-green-600" },
    rejected: { label: "Rejected", color: "text-red-600" },
    disbursed: { label: "Disbursed", color: "text-blue-600" },
    active: { label: "Active", color: "text-green-600" },
    completed: { label: "Completed", color: "text-gray-600" },
    defaulted: { label: "Defaulted", color: "text-red-800" },
  };
  
  return statusMap[status] || { label: status, color: "text-gray-600" };
}

export function formatPaymentStatus(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "text-yellow-600" },
    paid: { label: "Paid", color: "text-green-600" },
    overdue: { label: "Overdue", color: "text-red-600" },
    failed: { label: "Failed", color: "text-red-800" },
  };
  
  return statusMap[status] || { label: status, color: "text-gray-600" };
}
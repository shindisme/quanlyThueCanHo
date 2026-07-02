export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Định dạng số: 14565 => "14.565"
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("vi-VN").format(num);
}

// Rút gọn số lớn: 1500000 => "1.5Tr."
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "Tỉ";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "Tr.";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

export function numberToVietnameseWords(num: number): string {
  if (num === 0) return "không";
  const units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

  function readThreeDigits(n: number, showZeroHundred: boolean): string {
    let hundred = Math.floor(n / 100);
    let ten = Math.floor((n % 100) / 10);
    let unit = n % 10;
    let res = "";

    if (hundred > 0 || showZeroHundred) {
      res += units[hundred] + " trăm ";
    }

    if (ten > 0) {
      if (ten === 1) res += "mười ";
      else res += units[ten] + " ";
    } else if (hundred > 0 && unit > 0) {
      res += "lẻ ";
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) res += "mốt";
      else if (unit === 5 && ten > 0) res += "lăm";
      else res += units[unit];
    }
    return res.trim();
  }

  const groups = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];
  let temp = num;
  let parts = [];
  while (temp > 0) {
    parts.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let result = "";
  for (let i = parts.length - 1; i >= 0; i--) {
    let text = readThreeDigits(parts[i], i < parts.length - 1 && parts[i] > 0);
    if (text !== "") {
      result += text + " " + groups[i] + " ";
    }
  }

  return result.trim().replace(/\s+/g, " ");
}

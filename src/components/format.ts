export function hour(slot: number, startUtc: string) {
  const start = new Date(startUtc).toISOString();
  const instant = new Date(Date.parse(startUtc) + slot * 3600000).toISOString();
  const time = instant.slice(11, 23).replace(/:00\.000$/, "").replace(/\.000$/, "");
  return `${time}${instant.slice(0, 10) === start.slice(0, 10) ? "" : " (+1d)"}`;
}
export const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
export const kg = (value: number) => `${value.toFixed(2)} kg`;
export function localTime(startUtc: string, slot: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" }).format(new Date(Date.parse(startUtc) + slot * 3600000));
}

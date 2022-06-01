export default function log(type: "info" | "warn" | "error", message: string) {
  console.log(`[${new Date().toISOString()}] ${type}: ${message}`);
}

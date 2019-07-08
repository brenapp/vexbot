export function code(text: string) {
  return `\`\`\`${text}\`\`\``;
}

export function inline(text: string) {
  return `\`${text}\``;
}

export function escape(text: string) {
  return (text + "").replace(/[\\"']/g, "\\$&").replace(/\u0000/g, "\\0");
}

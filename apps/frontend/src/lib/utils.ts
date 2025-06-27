import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToMarkdown(faq: string[][]) {
  let markdown = "";

  for (const [question, answer] of faq) {
    markdown += `## ${question}\n\n${answer}\n\n`;
  }

  return markdown;
}

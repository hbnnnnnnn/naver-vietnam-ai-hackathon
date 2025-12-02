/**
 * Simple markdown parser for chatbot messages
 * Supports: **bold**, *italic*, `code`, bullet points, line breaks
 */

import React from "react";

export const parseMarkdown = (text) => {
  if (!text) return null;

  const lines = text.split("\n");
  const result = [];

  lines.forEach((line, lineIndex) => {
    if (line.trim() === "") {
      result.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Handle bullet points
    if (line.startsWith("• ")) {
      result.push(
        <li key={lineIndex} className="ml-4 mb-1 list-disc">
          {parseInlineMarkdown(line.substring(2))}
        </li>
      );
      return;
    }

    // Handle headers (lines wrapped in ** at both ends)
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
      result.push(
        <h4 key={lineIndex} className="font-semibold text-primary mb-2">
          {line.slice(2, -2)}
        </h4>
      );
      return;
    }

    // Regular paragraph with inline markdown
    result.push(
      <p key={lineIndex} className="mb-2 last:mb-0">
        {parseInlineMarkdown(line)}
      </p>
    );
  });

  return result;
};

const parseInlineMarkdown = (text) => {
  if (!text) return "";

  const result = [];
  let currentIndex = 0;

  // Regex patterns for different markdown elements
  const patterns = [
    {
      type: "bold",
      regex: /\*\*(.*?)\*\*/g,
      tag: "strong",
      className: "font-semibold",
    },
    { type: "italic", regex: /\*(.*?)\*/g, tag: "em", className: "italic" },
    {
      type: "code",
      regex: /`(.*?)`/g,
      tag: "code",
      className: "bg-gray-100 px-1 py-0.5 rounded text-xs font-mono",
    },
  ];

  // Find all matches for all patterns
  const matches = [];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({
        type: pattern.type,
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        tag: pattern.tag,
        className: pattern.className,
      });
    }
  });

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (keep the first one)
  const validMatches = [];
  for (const match of matches) {
    if (
      !validMatches.some(
        (vm) =>
          (match.start >= vm.start && match.start < vm.end) ||
          (match.end > vm.start && match.end <= vm.end) ||
          (match.start <= vm.start && match.end >= vm.end)
      )
    ) {
      validMatches.push(match);
    }
  }

  // Build result with styled elements
  validMatches.forEach((match, index) => {
    // Add text before this match
    if (currentIndex < match.start) {
      result.push(text.slice(currentIndex, match.start));
    }

    // Add the styled element
    const Tag = match.tag;
    result.push(
      <Tag key={`${match.type}-${index}`} className={match.className}>
        {match.content}
      </Tag>
    );

    currentIndex = match.end;
  });

  // Add remaining text
  if (currentIndex < text.length) {
    result.push(text.slice(currentIndex));
  }

  return result.length > 0 ? result : text;
};

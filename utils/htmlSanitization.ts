/**
 * HTML Sanitization Utilities
 * 
 * This module provides secure HTML sanitization functions to prevent XSS attacks
 * while allowing safe rendering of formatted content like ANSI-colored logs.
 */

/**
 * Escape HTML characters to prevent script injection
 * @param unsafe - The unsafe string to escape
 * @returns Safely escaped HTML string
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitize HTML content that may contain ANSI spans using DOMParser for improved security
 * Allows only <span> elements with specific classes and limited styles
 * @param html - HTML string that may contain ANSI formatting spans
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeAnsiHtml(html: string): string {
  // SSR fallback - return escaped text if DOM is not available
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeHtml(html);
  }

  try {
    // Use DOMParser for safer HTML parsing (recommended by security review)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const sanitizeNode = (node: Node): Node | null => {
      if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode((node as Text).data);
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        
        // Only allow span elements
        if (el.tagName.toUpperCase() === "SPAN") {
          // Keep only safe classes that start with "ansi-" or are explicitly allowed
          const allowedClasses = ["download-status", "timestamp"];
          const keptClasses = Array.from(el.classList).filter(
            (c) => c.startsWith("ansi-") || allowedClasses.includes(c)
          );
          
          // Allow only font-weight:bold in style attribute
          const style = el.getAttribute("style") || "";
          const hasBoldStyle = /font-weight\s*:\s*bold/i.test(style);
          
          // Create new sanitized span
          const newSpan = document.createElement("span");
          if (keptClasses.length > 0) {
            newSpan.className = keptClasses.join(" ");
          }
          if (hasBoldStyle) {
            newSpan.style.fontWeight = "bold";
          }
          
          // Recursively sanitize children
          Array.from(el.childNodes).forEach((child) => {
            const sanitizedChild = sanitizeNode(child);
            if (sanitizedChild) {
              newSpan.appendChild(sanitizedChild);
            }
          });
          
          return newSpan;
        }
        
        // For non-span elements, drop the element but keep sanitized children
        const fragment = document.createDocumentFragment();
        Array.from(el.childNodes).forEach((child) => {
          const sanitizedChild = sanitizeNode(child);
          if (sanitizedChild) {
            fragment.appendChild(sanitizedChild);
          }
        });
        return fragment;
      }
      
      return null;
    };
    
    // Process all nodes from the parsed document body
    const output = document.createElement("div");
    Array.from(doc.body.childNodes).forEach((child) => {
      const sanitized = sanitizeNode(child);
      if (sanitized) {
        output.appendChild(sanitized);
      }
    });
    
    return output.innerHTML;
  } catch (error) {
    // Fallback to escaped HTML if parsing fails
    console.warn('HTML sanitization failed, falling back to escaped content:', error);
    return escapeHtml(html);
  }
}

/**
 * Process and sanitize content that may contain ANSI escape sequences or HTML
 * @param content - Raw content from logs or external sources
 * @param allowHtml - Whether to allow and sanitize HTML content
 * @returns Safely processed content
 */
export function sanitizeContent(content: string, allowHtml: boolean = false): string {
  if (!content) return "";
  
  // If HTML is allowed and content contains span elements, sanitize it
  if (allowHtml && content.includes('<span')) {
    return sanitizeAnsiHtml(content);
  }
  
  // Otherwise, escape all HTML
  return escapeHtml(content);
}
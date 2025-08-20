import DOMPurify from 'dompurify';

export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeAnsiHtml(html: string): string {
  if (typeof window === "undefined") {
    return escapeHtml(html);
  }

  try {
    const cleanHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['span'],
      ALLOWED_ATTR: ['class', 'style'],
      ALLOW_DATA_ATTR: false,
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: null,
        attributeNameCheck: null,
        allowCustomizedBuiltInElements: false,
      },
      HOOK: {
        beforeSanitizeAttributes: function(node) {
          if (node.hasAttribute('class')) {
            const classes = node.getAttribute('class')?.split(' ') || [];
            const allowedClasses = classes.filter(c => 
              c.startsWith('ansi-') || 
              c === 'download-status' || 
              c === 'timestamp'
            );
            
            if (allowedClasses.length > 0) {
              node.setAttribute('class', allowedClasses.join(' '));
            } else {
              node.removeAttribute('class');
            }
          }
          
          if (node.hasAttribute('style')) {
            const style = node.getAttribute('style') || '';
            if (/font-weight\s*:\s*bold/i.test(style)) {
              node.setAttribute('style', 'font-weight: bold');
            } else {
              node.removeAttribute('style');
            }
          }
        }
      }
    });
    
    return cleanHtml;
  } catch (error) {
    console.warn('DOMPurify sanitization failed, falling back to escaped content:', error);
    return escapeHtml(html);
  }
}

export function sanitizeContent(content: string, allowHtml: boolean = false): string {
  if (!content) return "";
  
  if (allowHtml && content.includes('<span')) {
    return sanitizeAnsiHtml(content);
  }
  
  return escapeHtml(content);
}
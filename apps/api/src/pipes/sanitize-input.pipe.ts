import { PipeTransform, Injectable } from '@nestjs/common';
// sanitize-html is a CommonJS module that exports the sanitization function
// directly (module.exports = fn, with no `.default`). This project's tsconfig
// does NOT enable esModuleInterop, so the `import sanitizeHtml from
// 'sanitize-html'` form compiles to a bare `require` + `.default` access — and
// `.default` is undefined at runtime. That crashed this global XSS pipe with
// "(0, sanitize_html_1.default) is not a function" and returned HTTP 500 on
// every request body (including the cookie-consent endpoints). Use the
// TypeScript CJS import form, which compiles to a direct `require` and binds
// to the function itself.
import sanitizeHtml = require('sanitize-html');

/**
 * XSS SANITIZATION PIPE
 *
 * Strips all HTML tags from string values in request bodies
 * before validation. This prevents stored XSS attacks where
 * malicious scripts could be injected through free-text fields
 * like jobDescription, headline, summary, message content, etc.
 *
 * Applied globally in main.ts before ValidationPipe.
 */
@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: any): any {
    if (!value || typeof value !== 'object') {
      return value;
    }
    return this.sanitizeValue(value);
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [],           // Strip all HTML tags
        allowedAttributes: {},     // Strip all attributes
        disallowedTagsMode: 'escape', // Escape content rather than strip
      });
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }
    if (value && typeof value === 'object') {
      const result: any = {};
      for (const key of Object.keys(value)) {
        result[key] = this.sanitizeValue(value[key]);
      }
      return result;
    }
    return value;
  }
}
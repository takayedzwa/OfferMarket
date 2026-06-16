---
name: global-validation-pipe-config
description: Global ValidationPipe configuration for nested DTO support
metadata:
  type: project
---

**Configuration:** The global ValidationPipe in `apps/api/src/main.ts` should be configured with minimal settings to avoid interfering with custom validation pipes that handle complex nested DTOs:

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: false,
    transform: false,
  }),
);
```

**Why:** Setting `whitelist: true` causes NestJS to strip properties that don't match the destination type's metadata. For endpoints using custom validation pipes with nested DTO structures (like offers with compensation/contract/benefits sub-objects), this strips the nested data before the custom pipe receives it.

**Solution:** Individual endpoints that need strict validation should apply their own ValidationPipe at the decorator level with appropriate settings.

**Related:** [[offer-validation-pipe-fix]]

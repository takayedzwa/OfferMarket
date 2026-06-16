---
name: offer-validation-pipe-fix
description: OfferValidationPipe was stripping nested DTOs causing validation failures
metadata:
  type: feedback
---

**Problem:** The OfferValidationPipe was receiving the request body correctly, but the global ValidationPipe with `whitelist: true` was stripping all nested objects (compensation, contract, benefits, workArrangement, requirements) before they reached the custom pipe. This caused all validation errors to fire even when the data was correct.

**Why:** NestJS's global ValidationPipe with `whitelist: true` removes properties that aren't in the destination DTO's type metadata. Since the controller was using `@Body() createOfferDto: CreateOfferDto` without explicit transformation, the nested objects were being stripped.

**How to apply:** 
1. Set global ValidationPipe to `whitelist: false, transform: false` in `apps/api/src/main.ts`
2. Add guard in OfferValidationPipe.transform() to skip non-object values (query params)
3. Apply OfferValidationPipe directly to @Body decorator, not at method level

**Related:** [[global-validation-pipe-config]]

# Cost and Loop Control Rules

Any agent/AI/provider integration must have bounded execution.

Required where applicable:
- max provider calls per event/run;
- max tool calls/steps;
- timeout;
- retry ceiling and retry-safe classification;
- rate limit;
- budget/cost pre-check for billable calls;
- reconciliation/telemetry after calls;
- circuit breaker for repeated provider/tool failures;
- kill/revocation path.

Never allow outbound -> inbound echo, webhook retries or recursive tools to create unbounded paid loops.

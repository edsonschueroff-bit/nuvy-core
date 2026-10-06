# Deploy Policy

Development, load-to-process, pilot traffic and production activation are separate gates.

## Before production
Require:
1. reviewed code/PR;
2. required tests green;
3. rollback defined;
4. secrets/config verified without exposing values;
5. health-check plan;
6. explicit approval when the change reloads, deploys, migrates, sends real traffic or mutates production.

## During
- Change the smallest possible service/scope.
- Avoid simultaneous unrelated changes.
- Capture timestamps and health evidence.
- Stop on unexpected restart loops, elevated errors or ambiguous side effects.

## After
- Run health/smoke checks.
- Confirm no duplicate outbound/side effect.
- Verify telemetry/logs are sane and sanitized.
- Record result and rollback status in the canonical task.

Never combine a new risky implementation and production activation in the same unreviewed step.

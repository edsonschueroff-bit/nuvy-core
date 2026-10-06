# Skill: Nuvy Lab Network Safety

Use this skill for Nuvy Lab Agent, MikroTik, switch, VLAN, WireGuard, OLT, discovery or hardware test changes.

## Required invariants
- LAB traffic is isolated from production and from other benches.
- Never assume a handshake proves device/API readiness.
- Discovery is targeted/bounded; no uncontrolled network scanning.
- Preserve management/uplink and existing production configuration.
- Driver actions must be allowed by policy/test plan/capability.
- Timeouts, retries and cleanup/reconciliation are mandatory.
- A failure on one port/bench must not take down others.
- Safety/result classification is rules-first; AI may explain evidence but not override deterministic safety gates.

## Before completion
Provide test-plan evidence, cleanup result and confirmation that no unintended production route/config was changed.

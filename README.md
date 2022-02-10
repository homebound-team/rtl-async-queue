Provides a minimalistic queue for in-flight operations.

This allows tests to change their behavior from "wait until bespoke condition Y is true" to "wait until outstanding
operations are done".

This is a standalone package with no dependencies so that it can be called from production code.

In theory this could be useful for driving a mini-dashboard/spinner of "operations in-flight" or "failed async
operations", but really the core reason is to provide a dependency that doesn't need to be mocked out.

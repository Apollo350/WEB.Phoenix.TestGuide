# Testing Guide

## General
* [Test Placement](./General/testPlacement.md) - Folder structure of tests.
* [Dependency Injection](./General/dependencyInjection.md) - Critical concept to make your code testable.
* TODO: Mocking Data]
* [Tools](./General/tools.md) - Suggested tools to make testing easier.

## React

### Components - Testability
A big barrier to writing tests is often the way components are designed. Some components are less testable than others. It usually comes down to two reasons:

* **Complexity** - If a component's behavior is complex, it may also be hard to describe in a test.
* **Dependency** - If a component's logic can't be tested in isolation from external dependent code, it can be difficult to test.

#### Testability Strategies
* [Test base component only](./React/baseComponent.md) - Your unit test should only test your component, and not the code it imports. (*Dependency*)
* [Composite simpler components](./React/composite.md) - Turn complex components into a composition of simpler components. (*Complexity*)
* [Split monolithic components](./React/noMonolithic.md) - Very large components are nearly impossible to test. (*Complexity*)
* [Extract business logic](./React/extractLogic.md) - Take logic out of components, so you can test it separately. (*Complexity, Dependency*)

### Components - What to test?
* [Snapshots](./React/snapshots.md) - Sanity check for output.
* [Behavior Tests](./React/behavior.md) - Use Enzyme to test component behavior.

### Higher order components

### Utilities

### Thunk

## GraphQL
The GraphQL project is very testable! We should add tests for all new code, and for any existing code we make changes to.

### High priorities

Priorities for adding tests should be against:

* [store](./GraphQl/store.md) - Business logic for retrieving content.
* [lib and helpers](./GraphQl/helpers.md) - Re-usable helpers.
* [serializers](./GraphQl/serializers.md) - Data transformation layer.

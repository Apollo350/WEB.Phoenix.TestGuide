# Testing Guide

## General
* [Test Placement](./General/testPlacement.md) - Folder structure of tests

## React

### Keeping Components Testable
A big barrier to writing tests is often the way components are designed. Some components are less testable than others. It usually comes down to two reasons:

* **Complexity** - If a component's behavior is hard to follow, it will also be hard to desribe in a test.
* **Dependencies** - If a component's logic can't be tested in isolation from external dependent code, it can be difficult to test.

#### Strategies
* [Test base component only](./React/baseComponent.md) - Your unit test should only test your component, and not the code it imports. (*Depency*)
* [Composite simpler components](./React/composite.md) - Turn complex components into a composition of simpler components. (*Complexity*)
* [Split monolithic components](./React/noMonolithic.md) - Very large components are nearly impossible to test. (*Complexity*)
* [Extract business logic](./React/extractLogic.md) - Take logic out of components, so you can test it. (*Complexity, Dependency*)
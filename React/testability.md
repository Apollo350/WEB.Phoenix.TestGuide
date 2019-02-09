# Keeping Components Testable
A big barrier to writing tests is often the way components are designed. Some components are less testable than others. Some reasons:

* Too complex
* Dependencies

## Strategies
* [Test only base component only](./baseComponent.md) - Your unit test should only test your component, and not the code it imports.
* [Composite simple components](./composite.md) - Turn complex components into simpler components.
* Extract business logic - Keep your components dumb
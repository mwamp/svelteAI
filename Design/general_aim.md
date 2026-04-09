[<>](ROO AGENT: NOT EDIT THIS FILE)

Write an AI library for svelte:

## Aim:

- A dev friendly library to build AI integrated web apps. 
- Minimal syntax: We want to add a few symbols as possible to acheive our purpose, decorators would be ideal for instance, they are drop in, optional, legible

- localized information: A svelte components has:
  - html -> browser display
  - css -> style
  - js/ts -> compute / reactivity
    - AI endpoints: what are the variables, actions, ...


## Why:
Of course Agents can browse the web independently and use browser actions, fill forms etc.
But if we integrate in a web app we get:

- controlability: Well we might not want to let any agent access credit card data or such... Or perform destructive action without validation.
- Low cost complex actions: full integration with existing code so the model may call one tool to perform a complex action.
  - Better accuracy for a lower end model
  - Faster
- Better interactivity / UX. Agents are given access to priors that let them make better guesses than just the user interface


## Constraints:

- be model interface agnostic: no matter what chat system, model etc we make AI data and tools available to the model.

## What do we need in practice:

- Access to reactive data (ro/rw)
  - state, derived (ro), stores
  - Understanding of their type, meaning and use
- Access to select functions
- Access to components
- Access to navigation: Agent need to understand what different features the app offers and how to get there
- Possibly direct access to backend routes

## To models

Two models can be either competing or complementary: 

### Autonomous (expect MCP from external agent):

Agents would interact autonomously, kindof under the hood. All interactions would happen in the Agent interface (chat for instance)

- Interactive components could be sent so the agent interface could display them and the user gets a chance at interactive manipulation.

### In app

Agent expects to be integrated in the webapp, controls the interface alongside the user. Web app is built for User / Agent interaction:

Examples:
- Suggestion badges

## What to include

MCP?


Debatable:

- Mounting components makes data available to the model. Interacts 
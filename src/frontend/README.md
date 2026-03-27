# Online Microprocesser IDE Frontend

The frontend server for the Online Microprocesser IDE Platform.

## Quick Start

Before starting, ensure that [Node.js](https://nodejs.org/en) version 22.12 is installed on your local system.

Install dependencies.
```
cd ./src/mpide-frontend
npm install
```

Run in development mode.
```
npm run dev
```

The server will run on port `4200`, and is accessbile through the URL `http://localhost:4200/`.

## Development

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4.

The Angular CLI does not needed to be installed seperately. It is already downloaded as part of installing the frontend's dependencies.

To execute the CLI and its commands, run the following command:
```
npm run ng -- [arguments]
```

For example, the command `ng generate component mycomp` is done by executing `npm run ng -- generate component mycomp`.

## Code Style and Formatting

To ensure that all contributions has the same code format, run the linter before pushing and creating your PR.
```
npm run lint
```

Note that the linter may not be able to automatically correct the errors it detects.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

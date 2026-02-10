# Online Microprocessor IDE

Online IDE platform for Microprocessor board scripting development.

Currently supports:
- Arduino UNO
- Arduino NANO

# Prerequisites

This project is built on the following dependencies:
- [Java](https://www.java.com/) >= 25.0
- [Python](https://www.python.org/) >= 3.12
- [Node.js](https://nodejs.org/en) == 22.12.0
- [Maven](https://maven.apache.org/) >= 4.0.0
- [Docker](https://www.docker.com/)

Ensure that these technologies are installed locally on your device before running this program.

# Quick Start

Clone the repository.
```
git clone https://github.com/butterman0423/mpide-platform.git
cd /path/to/mpide-platform
```

In a seperate terminal instance, start the frontend server.
```
cd /path/to/mpide-platform
cd src/mpide-frontend
npm install
npm run dev
```

Then, in another terminal, spin up the compiler service.
```
cd /path/to/mpide-platform
docker compose up
```

Lastly, install dependencies, compile the project, and execute the backend service.
```
./mvnw clean install compile
java -jar target/mpide-platform
```

*For `Windows` OS, replace `./mvnw` with `./mvnw.cmd`.*

## Stopping the Compiler Service

To spin down the service, run:
```
docker compose down
```

# Code Style and Formatting

To ensure that all contributions has the same code format, run the formatter before pushing and creating your PR.
```
./mvnw validate
./mvnw formatter:format
```

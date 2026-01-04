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

Follow the instructions in `./src/mpide-frontend/README.md` and `./src/compiler/README.md` to run both the frontend and compiler microservices. Ensure both are running correctly before proceeding.

Install dependencies, compile the project, and execute the backend service.
```
./mvnw clean install compile
java -jar target/mpide-platform
```

*For `Windows` OS, replace `./mvnw` with `./mvnw.cmd`.*

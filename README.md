# Online Microprocessor IDE

Online IDE platform for Microprocessor board scripting development.

Currently supports:
- Arduino UNO
- Arduino NANO

# Prerequisites

This project is built on the following technologies:
- [Golang](https://go.dev/) >= 1.22.2
- [Node.js](https://nodejs.org/en) == 22.12.0
- [Docker](https://www.docker.com/)

Only the Node.js and Docker dependencies need to be installed locally to run the full service.

# Quick Start

Clone the repository.
```
git clone https://github.com/butterman0423/mpide-platform.git
cd /path/to/mpide-platform
```

Spin up the services.
```
cd /path/to/mpide-platform
docker compose up
```

In a seperate terminal instance, start the frontend server.
```
cd /path/to/mpide-platform
cd src/mpide-frontend
npm install
npm run start
```

The application is now running on `localhost`!

To shut down the services when finished:
```
cd /path/to/mpide-platform
docker compose down
```
# Web-Engineering-Semester1
Web-Engineering Projekt von Amica, Tamara, Stefan und Martin.

## Architecture

The project follows a typical 3-tier architecture with a reverse proxy, an application server, and a database.

### Dependency Map

```text
                     +-------------------+
                     |      Client       |
                     |  (Web Browser)    |
                     +---------+---------+
                               |
                               | (HTTP/80)
                               v
                     +---------+---------+
                     |      Nginx        |
                     |  (Reverse Proxy)  |
                     +---------+---------+
                               |
                               | (HTTP/3001)
                               v
                     +---------+---------+
                     |   Express App     | <-----+ serviert
                     |   (server.js)     |       |
                     +---------+---------+       |
                               |                 |
                +--------------+--------------+  |  +-----------------+
                |                             |  +--+     Public      |
                v                             v     | (Static Assets) |
      +---------+---------+         +---------+-----+-----------------+
      |     MongoDB       |         |      tests/   |
      |   (Database)      |         | (Mocha/Chai)  |
      +-------------------+         +---------------+
```

### Module Descriptions

- **Nginx**: Handles incoming traffic on port 80 and forwards it to the application server. It is configured in `nginx.conf`.
- **Express App (server.js)**: The backend server. It handles API requests, user authentication (registration/login), and serves static files from the `public/` directory.
- **MongoDB**: The primary data store for the application, used via Mongoose to store user information.
- **Public**: Contains the frontend assets (HTML, CSS, JS) that are served to the user's browser.
- **Tests**: Contains integration tests to verify API functionality.

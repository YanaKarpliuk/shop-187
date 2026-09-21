import 'dotenv/config';
import { buildApp } from './http/app.js';

const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`PORT must be a port number, but is "${process.env.PORT ?? ''}". See .env.example.`);
  process.exit(1);
}

buildApp().listen(port, () => {
  console.log(`Returns API listening on http://localhost:${port}`);
});

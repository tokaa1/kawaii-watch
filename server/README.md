### the server for kawaii-watch
realtime websocket

#### valid env vars
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `HTTPS_PORT`, default: 443
- `HTTP_PORT`, default: 3001
- `PROVIDER` (automatically specify the provider to skip CLI inquiry), options: `openrouter`, `openai`

install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

### ssl config
for https: drop in a cert and key in ssl/cert.pem and ssl/key.pem (in this directory, 'server')

- HTTP ws: `ws://localhost:3001`
- HTTPS ws: `wss://localhost:3443`

a https server will be ran if you have those two files present
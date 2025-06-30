# Solace Queue Browser

A production-grade web-based utility for browsing Solace message queues directly from your browser. This application runs entirely client-side without requiring a web server.

## Features

- Connect to any Solace message broker using WebMessaging
- Browse messages in queues
- View message contents, headers, and properties
- Filter messages
- Export messages to JSON
- Secure connection handling
- Responsive design for all devices

## Getting Started

1. Open `index.html` in your web browser
2. Enter your Solace connection details:
   - Broker URL (e.g., ws://localhost:8008 or wss://broker.example.com:443)
   - Message VPN
   - Username
   - Password
3. Click Connect
4. Select a queue to browse messages

## Security Notes

- Credentials are never stored and are only kept in memory during the active session
- All connections are made directly from the browser to the Solace broker
- For production use with secured brokers, ensure you're using WSS (WebSocket Secure) connections

## Dependencies

- Solace Web Messaging API for JavaScript
- Bootstrap 5.3.x for UI components
- Vue.js 3.x for reactive UI
- FileSaver.js for message export functionality

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

## License

MIT License 
import { networkInterfaces } from 'os';

/**
 * Get the local IP address for the machine
 */
export async function getIPAddress(): Promise<string> {
  const interfaces = networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const interfaceInfo = interfaces[name];
    if (interfaceInfo) {
      for (const info of interfaceInfo) {
        // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
        if (info.family === 'IPv4' && !info.internal) {
          return info.address;
        }
      }
    }
  }

  // Fallback to localhost if no external IP found
  return '127.0.0.1';
}

/**
 * Get the port number (default: 8111 for TeamCity)
 */
export async function getPort(): Promise<number> {
  return 8111;
}

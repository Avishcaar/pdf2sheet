const clients = new Set();

/**
 * Registers an active HTTP Response stream for Server-Sent Events (SSE).
 */
export const addSSEClient = (res) => {
    clients.add(res);
    console.log(`[SSE Live Stream] Client connected. Total active listeners: ${clients.size}`);

    // Send initial handshake ping
    try {
        res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clients: clients.size })}\n\n`);
    } catch (e) {
        // ignore
    }

    res.on('close', () => {
        clients.delete(res);
        console.log(`[SSE Live Stream] Client disconnected. Total active listeners: ${clients.size}`);
    });
};

/**
 * Broadcasts an event to all connected browsers in real-time (< 5ms).
 */
export const broadcastSSE = (eventType, payload) => {
    if (clients.size === 0) return;

    const message = JSON.stringify({
        type: eventType,
        data: payload,
        timestamp: new Date().toISOString()
    });

    console.log(`[SSE Broadcast] Pushing "${eventType}" to ${clients.size} live frontend client(s)...`);

    for (const client of clients) {
        try {
            client.write(`event: ${eventType}\ndata: ${message}\n\n`);
        } catch (err) {
            clients.delete(client);
        }
    }
};

export const getSSEClientCount = () => clients.size;

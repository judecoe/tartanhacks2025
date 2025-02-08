import asyncio
import websockets
import json

# Store the latest received URL
latest_url = None
clients = set()

async def websocket_handler(websocket):
    global latest_url
    clients.add(websocket)  # Add new client connection
    print("✅ WebSocket client connected.")

    try:
        async for message in websocket:
            data = json.loads(message)
            if 'url' in data:
                latest_url = data['url']
                print(f"📩 Received URL: {latest_url}")

                # Broadcast URL to all connected clients
                disconnected_clients = set()
                for client in clients:
                    try:
                        await client.send(json.dumps({"url": latest_url}))
                    except websockets.ConnectionClosed:
                        disconnected_clients.add(client)  # Mark client as disconnected
                
                # Remove disconnected clients
                for client in disconnected_clients:
                    clients.remove(client)

    except websockets.ConnectionClosed:
        print("❌ Client disconnected.")

    finally:
        clients.discard(websocket)  # Ensure cleanup when client disconnects

async def main():
    async with websockets.serve(websocket_handler, "localhost", 8765):
        print("✅ WebSocket server running on ws://localhost:8765")
        await asyncio.Future()  # Keep running indefinitely

asyncio.run(main())

import asyncio
import websockets
import json

# This will store the URL received from the extension
tophat_url = None
connected_clients = set()

async def handle_connection(websocket, path):
    global tophat_url
    # Add the client to our set
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            data = json.loads(message)
            if 'url' in data:
                tophat_url = data['url']
                print(f"Received URL: {tophat_url}")
                
                # Broadcast the URL to all connected clients
                for client in connected_clients:
                    try:
                        await client.send(json.dumps({"url": tophat_url}))
                    except websockets.exceptions.ConnectionClosed:
                        connected_clients.remove(client)
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed")
    finally:
        connected_clients.remove(websocket)

async def start_server():
    server = await websockets.serve(handle_connection, "localhost", 8765)
    print("WebSocket server started on ws://localhost:8765")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(start_server())
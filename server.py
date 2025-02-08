import asyncio
import websockets
import json

# This will store the URL received from the extension
tophat_url = None

async def handle_connection(websocket, path):
    global tophat_url
    try:
        async for message in websocket:
            data = json.loads(message)
            if 'url' in data:
                tophat_url = data['url']
                print(f"Received URL: {tophat_url}")

                # Once the URL is received, we send a confirmation back to the extension
                await websocket.send(json.dumps({"status": "URL received"}))
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed")

async def start_server():
    # Start WebSocket server at port 8765
    server = await websockets.serve(handle_connection, "localhost", 8765)
    print("WebSocket server started on ws://localhost:8765")
    await server.wait_closed()

# Run the server
asyncio.run(start_server())
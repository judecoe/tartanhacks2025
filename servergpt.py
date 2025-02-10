import asyncio
import websockets
import json
from gpt_functions import gpt_functions
from datetime import datetime

# Initialize gpt class
gpt = gpt_functions()
response_history = {}  # Store question-answer pairs

# Removes unnecessary space in input text
def clean_text(text):
    if not text:
        return text
    return ' '.join(text.split())

# Stores responses into reponse_history
def save_response(question, response_data):
    timestamp = datetime.now().isoformat()
    if question not in response_history:
        response_history[question] = []
    response_history[question].append({
        'timestamp': timestamp,
        'response': response_data
    })

# This is the websocket equalivalent of an event listener 
async def handle_connection(websocket):
    print(f"New client connected")
    try:
        async for message in websocket:
            try:
                # Check for data in message and processes it
                data = json.loads(message)
                print(f"Received data: {data}")
                
                question = clean_text(data.get('question', ''))
                answers = data.get('answers', [])
                question_type = data.get('questionType')

                # Check if we have a recent response for this question and send the cached response if so (conserve api calling)
                if question in response_history:
                    latest_response = response_history[question][-1]
                    time_diff = (datetime.now() - datetime.fromisoformat(latest_response['timestamp'])).total_seconds()
                    if time_diff < 300:  # 5 minutes
                        print(f"Using cached response for question: {question}")
                        await websocket.send(json.dumps({
                            'answer': latest_response['response']['answer'],
                            'questionType': latest_response['response']['questionType']
                        }))
                        # Skips the unnecessary GPT processing 
                        continue

                # Clean answers for proper processing in gpt.create_prompts() function
                answer_options = {}
                if answers:
                    for answer in answers:
                        answer_options[answer['option'].lower()] = clean_text(answer['text'])

                #Gets GPT response back
                print(f"Processing with GPT: {question_type}, {question}, {answer_options}")
                response, quest_type = gpt.create_prompts(
                    question_type,
                    question,
                    answer_options
                )
                print(f"GPT Response: {response}, {quest_type}")

                # Formats the data to be sent back to background.js
                response_data = {
                    'answer': response,
                    'questionType': quest_type
                }
                
                # Save response
                save_response(question, response_data)

                # Send the json data back through the websocket to background.js
                await websocket.send(json.dumps(response_data))
                
            except Exception as e:
                print(f"Error processing message: {e}")
                await websocket.send(json.dumps({'error': str(e)}))
    
    # Exception error handling
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Connection handler error: {e}")
    finally:
        print("Connection handler finished")

async def main():
    print("Starting WebSocket server...")
    # Create websocket server that handles any clients that connect with the handle_connection callback function
    # Server is running locally (on same device) and is connected through port 8765. 
    async with websockets.serve(handle_connection, "localhost", 8765, ping_interval=None):
        print("WebSocket server is running on ws://localhost:8765")
        # Ensures server runs indefinitely 
        await asyncio.Future()

if __name__ == "__main__":
    #Start main asynchronous event loop
    asyncio.run(main())
import asyncio
import websockets
import json
from gpt_functions import gpt_functions
from datetime import datetime

gpt = gpt_functions()
response_history = {}  # Store question-answer pairs

def clean_text(text):
    if not text:
        return text
    return ' '.join(text.split())

def save_response(question, response_data):
    timestamp = datetime.now().isoformat()
    if question not in response_history:
        response_history[question] = []
    response_history[question].append({
        'timestamp': timestamp,
        'response': response_data
    })

async def handle_connection(websocket):
    print(f"New client connected")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                print(f"Received data: {data}")
                
                question = clean_text(data.get('question', ''))
                answers = data.get('answers', [])
                question_type = data.get('questionType')

                # Check if we have a recent response for this question
                if question in response_history:
                    latest_response = response_history[question][-1]
                    time_diff = (datetime.now() - datetime.fromisoformat(latest_response['timestamp'])).total_seconds()
                    if time_diff < 300:  # 5 minutes
                        print(f"Using cached response for question: {question}")
                        await websocket.send(json.dumps({
                            'answer': latest_response['response']['answer'],
                            'questionType': latest_response['response']['questionType']
                        }))
                        continue

                answer_options = {}
                if answers:
                    for answer in answers:
                        answer_options[answer['option'].lower()] = clean_text(answer['text'])

                print(f"Processing with GPT: {question_type}, {question}, {answer_options}")
                response, quest_type = gpt.create_prompts(
                    question_type,
                    question,
                    answer_options
                )
                print(f"GPT Response: {response}, {quest_type}")

                response_data = {
                    'answer': response,
                    'questionType': quest_type
                }
                
                # Save response
                save_response(question, response_data)

                await websocket.send(json.dumps(response_data))
                
            except Exception as e:
                print(f"Error processing message: {e}")
                await websocket.send(json.dumps({'error': str(e)}))
    
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected")
    except Exception as e:
        print(f"Connection handler error: {e}")
    finally:
        print("Connection handler finished")

async def main():
    print("Starting WebSocket server...")
    async with websockets.serve(handle_connection, "localhost", 8765, ping_interval=None):
        print("WebSocket server is running on ws://localhost:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
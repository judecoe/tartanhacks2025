from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
import time
import subprocess
import asyncio
import websockets
import json
import websockets

# Function to start the WebSocket server in the background
def start_websocket_server():
    subprocess.Popen(['python', 'server.py'])

# Function to listen for the URL from the WebSocket server
async def listen_for_url():
    global tophat_url
    async with websockets.connect('ws://localhost:8765') as websocket:
        print("Connected to WebSocket server.")
        
        # Keep listening for messages
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            if 'url' in data:
                tophat_url = data['url']
                print(f"Received URL: {tophat_url}")

                # Once URL is received, break the loop
                break


async def main():
    # Start the WebSocket server automatically
    start_websocket_server()

    # Give the server a few seconds to initialize
    time.sleep(2)

    # Listen for the URL in the WebSocket server
    await listen_for_url()

    # Chrome options (optional, for headless mode or other configurations)
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # Optional: Uncomment to run in headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.debugger_address = "127.0.0.1:9222"  # Ensure this matches the port you're using





    service = Service()
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)

    # Open the TopHat website
    driver.get("https://tophat.com")

    # Access open button
    open_element = driver.find_element(By.XPATH, "//span[text()='Open']")

    #Go into question
    open_element.click()

    # # Retrieve question type 
    # quest_type = gpt_answers.get_quest_type()
    # # Retrieve answers
    # answer = gpt_answers.get_answers()
    # # Working with webpage elements------------------





    # # Use case for multiple choice question
    # if question_type == mult_choice:
    #     element = driver.find_element(By.CLASS_NAME, f"{}")



    # # Use case for when the question involves a text entry: element.send_keys(variable_answer + Keys.TAB + Keys.ENTER) 

    # # Perform actions on the element (e.g., click or send text)
    # element.click()  # or element.send_keys("some text")


    time.sleep(10)

    driver.quit()



# Run the asyncio loop
asyncio.run(main())
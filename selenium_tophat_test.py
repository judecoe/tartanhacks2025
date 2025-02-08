from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import asyncio
import json
import websockets
import sys
# from gpt_answers import gpt_answers


# Global variable to store the URL
tophat_url = None

# Function to start the WebSocket server in the background
async def start_websocket_server():
    # Use sys.executable to get the correct Python path
    process = await asyncio.create_subprocess_exec(
        sys.executable, 'server.py',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    return process

# Function to listen for the URL from the WebSocket server
async def listen_for_url():
    global tophat_url
    retry_count = 0
    max_retries = 5
    
    while retry_count < max_retries:
        try:
            async with websockets.connect('ws://localhost:8765', timeout=10) as websocket:
                print("Connected to WebSocket server.")
                
                while True:
                    try:
                        message = await websocket.recv()
                        data = json.loads(message)
                        if 'url' in data:
                            tophat_url = data['url']
                            print(f"Received URL from server: {tophat_url}")
                            return True
                    except websockets.exceptions.ConnectionClosed:
                        print("Connection closed unexpectedly")
                        break
        except (ConnectionRefusedError, OSError) as e:
            print(f"Connection attempt {retry_count + 1} failed: {e}")
            retry_count += 1
            if retry_count < max_retries:
                await asyncio.sleep(2)
            else:
                print("Max retries reached. Could not connect to WebSocket server.")
                break
    
    return False

async def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    service = Service(tophat_url)
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

async def main():
    
    # Start WebSocket server and properly await it
    print("Starting WebSocket server...")
    server_process = await start_websocket_server()
    print("WebSocket server started")

    try:
        # Wait for URL
        print("Waiting for URL from extension...")
        url_received = await listen_for_url()
        
        if not url_received:
            print("Failed to receive URL. Exiting...")
            return
        
        # Setup and start Selenium
        print("Starting Selenium...")
        driver = await setup_driver()

        try:
            # Navigate to TopHat using the received URL
            if tophat_url:
                driver.get(tophat_url)
            else:
                driver.get("https://tophat.com")
            
            # Wait for and find the Open button
            wait = WebDriverWait(driver, 10)
            open_element = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//span[text()='Open']"))
            )
            
            # Add debugging information
            print("Found Open button")
            
            # Wait for visual confirmation
            await asyncio.sleep(10)


            # #Go into question
            # open_element.click()

            # # Retrieve question type 
            # quest_type = gpt_answers.get_quest_type()
            # # Retrieve answers
            # answer = gpt_answers.get_answers()


            # # Working with webpage elements------------------



            # # Use case for multiple choice question
            # if quest_type == "Multiple Choice (Single Answer)" or "Likert Scale":
                # count = gpt_answers.get_count()
                # answer = answer.upper()
                # element = driver.find_element(By.CSS_SELECTOR, f"[aria-label^={answer}]")
                # element.click()

                # enter element 
                # enter_element = driver.find_element(By.XPATH, "//span[text()='Enter']")
                # enter_element.click()
                # element.send_keys(Keys.ENTER)
                
            # # Use case for when the question involves a text entry
            # if quest_type == "Word Answer" or "Long Answer":
                # element = driver.find_element(By.CLASS_NAME, )
                # element.send_keys(answer + Keys.TAB + Keys.ENTER) # can change to click submit instead, but should work
            
            # # Use case for Fill in the Blank
            # for element in answer:
            #   element = driver.find_element(By.CLASS_NAME, )
            #   element.send_keys(element + Keys.TAB + Keys.ENTER)
            
            # # Use case for Numeric Answer
            # if quest_type == "Numeric Answer":
                # element = driver.find_element(By.CLASS_NAME, )
                # element.send_keys(answer + Keys.TAB + Keys.ENTER) 
            # # Perform actions on the element (e.g., click or send text)
            # element.click()  # or element.send_keys("some text")

        finally:
            driver.quit()

    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        # Cleanup server process
        if server_process:
            print("Shutting down WebSocket server...")
            try:
                server_process.terminate()
                await server_process.wait()
            except Exception as e:
                print(f"Error during server shutdown: {e}")



# Run the asyncio loop
asyncio.run(main())
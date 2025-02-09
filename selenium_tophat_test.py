from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import asyncio
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import websockets
import sys
import time
import requests

async def start_websocket_server():
    """Start the WebSocket server in the background."""
    process = await asyncio.create_subprocess_exec(
        sys.executable, 'server.py',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    return process

async def listen_for_url():
    """Listen for the URL from the WebSocket server."""
    async with websockets.connect('ws://localhost:8765') as websocket:
        print("✅ Connected to WebSocket server.")
        while True:
            try:
                message = await websocket.recv()
                data = json.loads(message)
                if 'url' in data:
                    url = data['url']
                    print(f"📩 Received URL: {url}")
                    return url
            except websockets.exceptions.ConnectionClosed:
                print("❌ Connection closed")
                return None

def get_debugger_url():
    """Get the Chrome debugger WebSocket URL."""
    try:
        response = requests.get('http://localhost:9222/json')
        for tab in response.json():
            if tab.get('type') == 'page':
                return tab['webSocketDebuggerUrl']
    except Exception as e:
        print(f"❌ Error getting debugger URL: {e}")
        return None

def setup_driver():
    """Set up Chrome driver to connect to existing instance."""
    try:
        # Wait for Chrome to be ready
        max_retries = 5
        for i in range(max_retries):
            try:
                options = Options()
                options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
                driver = webdriver.Chrome(options=options)
                print("✅ Connected to existing Chrome instance")
                return driver
            except Exception as e:
                if i < max_retries - 1:
                    print(f"⚠️ Retry {i+1}: Waiting for Chrome to be ready...")
                    time.sleep(2)
                else:
                    raise e
    except Exception as e:
        print(f"❌ Failed to connect to Chrome: {e}")
        return None

async def main():
    server_process = None
    driver = None
    
    try:
        # Start WebSocket server
        print("🚀 Starting WebSocket server...")
        server_process = await start_websocket_server()
        print("✅ WebSocket server started")

        # Connect to existing Chrome
        print("🔄 Connecting to Chrome...")
        driver = setup_driver()
        if not driver:
            print("❌ Could not connect to Chrome. Make sure it's running with remote debugging enabled.")
            return

        # Wait for and handle URLs
        while True:
            url = await listen_for_url()
            if url:
                print(f"🔗 Navigating to: {url}")
                try:
                    # Execute JavaScript to navigate in current tab
                    driver.execute_script(f"window.location.href = '{url}';")
                    print("✅ Navigation command sent")
                except Exception as e:
                    print(f"❌ Navigation error: {e}")
            else:
                break

    except KeyboardInterrupt:
        print("\n👋 Received exit signal")
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"❌ An error occurred: {e}")
    
            # Add debugging information


        # Go into question
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
        if driver:
            try:
                # Don't quit the browser, just close our connection
                driver.quit()
            except:
                pass
        if server_process:
            print("🧹 Cleaning up...")
            server_process.terminate()
            await server_process.wait()

if __name__ == "__main__":
    asyncio.run(main())
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import asyncio
import json
import websockets
import sys
import os

# Global variable to store the URL
tophat_url = None

async def start_websocket_server():
    """Start the WebSocket server in the background."""
    process = await asyncio.create_subprocess_exec(
        sys.executable, 'server.py',
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    return process

async def listen_for_url():
    """Listen for the URL from the WebSocket server with retries."""
    global tophat_url
    retry_count = 0
    max_retries = 5
    
    while retry_count < max_retries:
        try:
            async with websockets.connect('ws://localhost:8765') as websocket:
                print("✅ Connected to WebSocket server.")
                
                while True:
                    try:
                        message = await websocket.recv()
                        data = json.loads(message)
                        if 'url' in data:
                            tophat_url = data['url']
                            print(f"📩 Received URL from server: {tophat_url}")
                            return True
                    except websockets.exceptions.ConnectionClosed:
                        print("❌ Connection closed unexpectedly")
                        break
        except (ConnectionRefusedError, OSError) as e:
            print(f"⚠️ Connection attempt {retry_count + 1} failed: {e}")
            retry_count += 1
            if retry_count < max_retries:
                print("🔄 Retrying connection...")
                await asyncio.sleep(2)
            else:
                print("❌ Max retries reached. Could not connect to WebSocket server.")
                break
    
    return False

def setup_remote_debugging():
    """Set up Chrome remote debugging on a dynamic port."""
    import socket
    
    # Find an available port
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(('', 0))
    port = sock.getsockname()[1]
    sock.close()
    
    # Get Chrome debugging options
    chrome_options = Options()
    chrome_options.add_experimental_option("debuggerAddress", f"127.0.0.1:{port}")
    
    return port, chrome_options

def connect_to_existing_chrome():
    """Connect to the existing Chrome browser."""
    try:
        # Try to connect to existing Chrome first
        options = Options()
        options.add_experimental_option("debuggerAddress", "127.0.0.1:9222")
        driver = webdriver.Chrome(options=options)
        print("✅ Connected to existing Chrome instance")
        return driver
    except Exception as e:
        print(f"⚠️ Couldn't connect to existing Chrome: {e}")
        return None

async def keep_alive():
    """Keep the script running until interrupted."""
    try:
        while True:
            await asyncio.sleep(1)
    except asyncio.CancelledError:
        return

async def main():
    server_process = None
    driver = None
    
    try:
        # Start WebSocket server
        print("🚀 Starting WebSocket server...")
        server_process = await start_websocket_server()
        print("✅ WebSocket server started")

        # Wait for URL
        print("⏳ Waiting for URL from extension...")
        url_received = await listen_for_url()
        
        if not url_received:
            print("❌ Failed to receive URL. Exiting...")
            return
        
        # Try to connect to existing Chrome
        print("🔄 Connecting to Chrome...")
        driver = connect_to_existing_chrome()
        
        if not driver:
            print("❌ Could not connect to Chrome browser.")
            return

        # Find TopHat tab or create new one
        tophat_tab_found = False
        original_handle = driver.current_window_handle
        
        # Look for existing TopHat tab
        for handle in driver.window_handles:
            driver.switch_to.window(handle)
            if 'tophat' in driver.current_url.lower():
                print("✅ Found existing TopHat tab")
                tophat_tab_found = True
                break
        
        if not tophat_tab_found:
            print("❌ No existing TopHat tab found.")
            # Switch back to original tab
            driver.switch_to.window(original_handle)
            return

        try:
            # Navigate in the existing tab
            print(f"🔗 Navigating to: {tophat_url}")
            driver.get(tophat_url)
            
            # Wait for navigation to complete
            WebDriverWait(driver, 10).until(
                EC.url_contains('tophat')
            )
            
            print(f"✅ Successfully navigated to: {driver.current_url}")
            print("\n✅ Session established - Press Ctrl+C to exit")
            
            await keep_alive()

        except Exception as e:
            print(f"❌ Navigation error: {e}")

    except KeyboardInterrupt:
        print("\n👋 Received exit signal - cleaning up...")
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    
            # Add debugging information


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
        # Only quit the driver if we created it
        if driver:
            try:
                # Don't quit the browser, just close our connection to it
                driver.quit()
            except Exception:
                pass
        
        if server_process:
            print("🧹 Shutting down WebSocket server...")
            try:
                server_process.terminate()
                await server_process.wait()
            except Exception as e:
                print(f"⚠️ Error during server shutdown: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
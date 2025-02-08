from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
import time


# Define your existing session details
# session_id = "7f592379-dcd1-4742-9c76-f5f033593004"  # Get this from the browser's developer tools or logs

# The WebSocket URL of the tab you want to interact with
# websocket_url = web_socket_url = "ws://127.0.0.1:9222/devtools/page/8695524FEE489C0989185523C895C2D7" 


# Chrome options (optional, for headless mode or other configurations)
chrome_options = Options()
# chrome_options.add_argument("--headless")  # Optional: Uncomment to run in headless mode
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")
chrome_options.debugger_address = "127.0.0.1:9222"  # Ensure this matches the port you're using

# # Attach to the existing session
# driver = webdriver.Remote(
#     command_executor=executor_url,
#     desired_capabilities={})
# driver.session_id = session_id



service = Service()
options = webdriver.ChromeOptions()
driver = webdriver.Chrome(service=service, options=options)

# Open the TopHat website
driver.get("https://tophat.com")

# Access open button
open_element = driver.find_element(By.XPATH, "//span[text()='Open']")

#Go into question
open_element.click()

# Retrieve question type 
quest_type = gpt_answers.get_quest_type()
# Retrieve answers
answer = gpt_answers.get_answers()
# Working with webpage elements------------------





# Use case for multiple choice question
if question_type == mult_choice:
    element = driver.find_element(By.CLASS_NAME, f"{}")



# Use case for when the question involves a text entry: element.send_keys(variable_answer + Keys.TAB + Keys.ENTER) 

# Perform actions on the element (e.g., click or send text)
element.click()  # or element.send_keys("some text")


time.sleep(10)

driver.quit()
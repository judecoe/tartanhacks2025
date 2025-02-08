from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options


# Path to your ChromeDriver (Homebrew installs it in /opt/homebrew/bin)
chrome_driver_path = '/opt/homebrew/bin/chromedriver'

# Chrome options (optional, for headless mode or other configurations)
chrome_options = Options()
# chrome_options.add_argument("--headless")  # Optional: Uncomment to run in headless mode
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")



# Initialize the WebDriver
driver = webdriver.Chrome(service=Service(chrome_driver_path), options=chrome_options)

# Open the TopHat website
driver.get("https://tophat.com/")


# Print the page title
print(driver.title)

# Find an element by its ID (change the ID to match one on the page)
element = driver.find_element(By.ID, 'some-element-id')

# Perform actions on the element (e.g., click or send text)
element.click()  # or element.send_keys("some text")


# Close the browser after interaction
driver.quit()
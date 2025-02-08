# from selenium import webdriver
# from selenium.webdriver.chrome.service import Service
# from selenium.webdriver.common.by import By
# from selenium.webdriver.chrome.options import Options
# import os

# # Get the directory of the current script
# project_path = os.path.dirname(os.path.abspath(__file__))

# # Construct the full path to chromedriver
# chrome_driver_path = os.path.join(project_path, "chromedriver")

# print(chrome_driver_path)

# # Chrome options (optional, for headless mode or other configurations)
# chrome_options = Options()
# # chrome_options.add_argument("--headless")  # Optional: Uncomment to run in headless mode
# chrome_options.add_argument("--no-sandbox")
# chrome_options.add_argument("--disable-dev-shm-usage")


# # Initialize the WebDriver
# #service = Service(executable_path="chromedriver.exe")
# #driver = webdriver.Chrome(service=chrome_driver_path)
# service = Service(chrome_driver_path)
# options = webdriver.ChromeOptions()
# driver = webdriver.Chrome(service=service, options=options)
# # ...

# # Open the TopHat website
# driver.get("https://tophat.com")


# # Print the page title
# print(driver.title)

# # Find an element by its ID (change the ID to match one on the page)
# element = driver.find_element(By.CLASS_NAME, 'nav-login btn btn-primary')

# # Perform actions on the element (e.g., click or send text)
# element.click()  # or element.send_keys("some text")


# # Close the browser after interaction
# driver.quit()



from selenium import webdriver
from selenium.webdriver.chrome.service import Service

service = Service()
options = webdriver.ChromeOptions()
driver = webdriver.Chrome(service=service, options=options)
# ...
driver.quit()
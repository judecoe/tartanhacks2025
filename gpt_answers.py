import os
from openai import OpenAI
from dotenv import load_dotenv

class gpt_answers:

    def __init__(self):
        #---------------------------------------------------------------#
        #                  Initialize OpenAI Client

        load_dotenv()
        self.client = OpenAI(api_key = os.getenv("OPEN_AI_API_KEY"))

        #---------------------------------------------------------------#
        #              Question information from TopHat

        self.question_type = {
            "Multiple Choice (Single Answer)" : "You will be asked a multiple choice question. You may only select one answer. Respond only with the letter corresponding to the correct answer, no punctuation.",
            "Multiple Choice (Multi Answer)" : "You will be asked a multiple choice question. You may select multiple answers. Respond only with the letters corresponding to the correct answers. Each letter answer should be separated by a comma.",
            "True or False" : "You will be asked a true or false question. Respond with one word, no punctuation. The only responses you should give is 'true' or 'false'",
            "Likert Scale" : "You will be asked a multiple choice question. The question will ask about your sentiment on a topic. Answer as if you are a college student who is strongly familiar with the course material. You may only select one answer. Respond only with the letter corresponding to the correct answer, no punctuation",
            "Numeric Answer" : "You will be asked a question with a numeric answer. Respond only with the number that answers the question correctly, no punctuation. ",
            "Word Answer" : "You will be asked a question with a word answer. Respond only with the word or phrase that answers the question correctly. ",
            "Fill in the Blank" : "You will be asked a fill in the blank question. Respond with a word that best fills each blank. Each answer should be separated by a comma. The answers should be in the same order that their corresponding blanks appear in the question. ONLY GIVE THE WORD THAT GOES IN THE BLANK.",
            "Long Answer" : "You will be asked a long answer question. Type a short response to the question. Your response should be 3-6 sentences long.",
        }


    #---------------------------------------------------------------#
    #                       GPT Prompts

    #ARGUMENTS: 
    #quest_type: must should match keys in question_type 
    #question: The question, without the answer options. For fill in the blank questions, indicate blanks with an underscore 
    #answer_options: Optional. Should be a dictionary. The key is the answer letter (a, b, c,..., etc.), and the value is the answer prompt.
    def create_prompts(self, quest_type, question, answer_options = None):
        #if question type is valid proceed to gpt prompts. If not valid, run random answer. 
        if quest_type in self.question_type:
            dev_prompt = self.question_type[quest_type]
            question_prompt = "Question: " + question
            if answer_options:
                question_prompt += "    Answer Options: "
                for key in answer_options:
                    question_prompt += "{" + key + ": " + answer_options[key] + "}, "
            print(f"Dev prompt: {dev_prompt} \n")
            print(f"Question prompt: {question_prompt} \n")
            return self.prompt_gpt(dev_prompt, question_prompt, quest_type)
        else:
            #just try pressing submit button. 
            #tophat will throw an error and tell you what field to complete
            #if field is a button just select random answer 
            #if field is a text entry just enter random text and submit 
            return False


    #---------------------------------------------------------------#
    #                       #API Calls

    def prompt_gpt(self, dev_prompt, question_prompt, quest_type):

        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "developer",
                    "content": dev_prompt
                },
                {
                    "role": "user",
                    "content": question_prompt,
                }
            ],
            model="gpt-4o",
        )

        response = (chat_completion.choices[0].message.content)

        #parse response and return cleaned answers
        #questions with multiple answers will be returned as a list
        if quest_type == "Word Answer" or quest_type == "Long Answer":
            return response
        else:
            response = response.lower()
            if quest_type == "Fill in the Blank" or quest_type == "Multiple Choice (Multi Answer)":
                response = response.split(",")
                response = [answ.lstrip() for answ in response]
            return response

# from gpt_functions import gpt_functions

# class gpt_answers:

#     # Receieve parameters from jude
#     # quest_type is the key from the question_type dictionary in gpt_functions 
#     quest_type = 
#     # question is just the string containing the question
#     question = 
#     # answer_options is a dictionary containing the answer options for multiple choice questions, otherwise NONE
#     answer_options = 
#     # call function that provides answers & question type
#     answers, quest_type = gpt_functions.create_prompts(quest_type, question, answer_options)

    '''returns array if quest_type is Fill in the Blank or Multi Answer Multiple Choice 
    returns string if Word Answer or Long Answer
    returns char (single letter string) if Single Answer Multiple Choice or Likert Scale
    returns int if Numeric Answer 
    returns False otherwise'''
    def get_answers(): 
        return answers
    # returns string of question type or false
    def get_quest_type():
        return quest_type
        
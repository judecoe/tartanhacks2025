from gpt_functions import gpt_functions

class gpt_answers:
    
    #receieve parameters from jude
    quest_type = 
    question = 
    answer_options = 

    # call function that provides answers & question type
    answers, quest_type = gpt_functions.create_prompts(quest_type, question, answer_options)

    def get_answers():
        return answers
    def get_quest_type():
        return quest_type
        
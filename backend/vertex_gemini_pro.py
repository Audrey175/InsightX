import vertexai
from vertexai.preview.generative_models import GenerativeModel

project_id = "peerless-bond-477908-e1"  # replace with your Google Cloud project ID
location = "us-central1"  # replace with your desired location

vertexai.init(project=project_id, location=location)

model = GenerativeModel("gemini-pro")  # replace with desired Gemini model
response = model.generate_content('Say hi')

print(response.text)  # prints the generated text response
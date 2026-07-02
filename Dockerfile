# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the agent script and knowledge base into the container
COPY updates_agent.py .
COPY rules_kb.json .

# Define labels for the image
LABEL org.opencontainers.image.source=https://github.com/midtnvbc/updates-agent
LABEL org.opencontainers.image.description="Mid TN Volleyball Club Updates Agent"
LABEL org.opencontainers.image.licenses=MIT

# Run updates_agent.py when the container launches
CMD ["python", "./updates_agent.py"]

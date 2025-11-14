#!/bin/bash
# filepath: create_lambda.sh

if [ $# -ne 1 ]; then
  echo "Usage: $0 <function-name>"
  exit 1
fi

FUNCTION_NAME=$1
BASE_DIR="functions/$FUNCTION_NAME"
APP_DIR="$BASE_DIR/app"

# Create directories
mkdir -p "$APP_DIR"

# Create README.md (empty)
touch "$BASE_DIR/README.md"

# Create app.py with handler
cat > "$APP_DIR/main.py" << EOF
import json
import os
from ldap3 import Server, Connection, ALL, SUBTREE


def handler(event, context):
    """
    Lambda handler for $FUNCTION_NAME function
    
    Args:
        event: Lambda event
        context: Lambda context
        
    Returns:
        Lambda response
    """
    try:
        # Your function logic here
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Success from $FUNCTION_NAME'})
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
EOF

# Create setup.py
cat > "$BASE_DIR/setup.py" << EOF
"""Package setup."""

import os
import setuptools

# Requirements
requirements = [
    "ldap3==2.9.1",
]

# Development Requirements
requirements_dev = ["pytest==7.4.0", "black==23.9.1"]

with open("./README.md", "r") as f:
    long_description = f.read()

setuptools.setup(
    name="$FUNCTION_NAME",
    author="LEAP-AD",
    author_email="core-devops@lftechnology.com",
    description="Lambda functions for helipad for active directory",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/koiralaprt/admgmt/functions/$FUNCTION_NAME",
    packages=setuptools.find_packages(),
    install_requires=requirements,
    extras_require={"dev": requirements_dev},
    classifiers=[
        "Programming Language :: Python :: 3",
        "Operating System :: OS Independent",
    ],
)
EOF

# Create Dockerfile
cat > "$BASE_DIR/Dockerfile" << EOF
FROM python:3.12-slim AS base

FROM base AS main

WORKDIR /source

COPY ["app", "./app"]
COPY ["setup.py", "README.md", "./"]

RUN apt-get --allow-releaseinfo-change update -y \\
  && apt-get install -y git libpq-dev build-essential \\
  && pip install . \\
  && pip install awslambdaric 

ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]

CMD [ "app.main.handler" ]
EOF

echo "Lambda function structure for '$FUNCTION_NAME' created successfully in $BASE_DIR"
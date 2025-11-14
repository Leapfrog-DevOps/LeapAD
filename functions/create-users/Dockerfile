FROM python:3.12-slim AS base

FROM base AS main

WORKDIR /source

COPY ["app", "./app"]
COPY ["setup.py", "README.md", "./"]

RUN apt-get --allow-releaseinfo-change update -y \
  && apt-get install -y git libpq-dev build-essential \
  && pip install . \
  && pip install awslambdaric 

ENTRYPOINT [ "/usr/local/bin/python", "-m", "awslambdaric" ]

CMD [ "app.main.handler" ]

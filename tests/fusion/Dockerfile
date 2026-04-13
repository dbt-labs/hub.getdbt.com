ARG py_version=3.11.2

FROM python:$py_version-slim-bullseye AS base

SHELL ["/bin/bash", "-c"]


RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  # Apply security updates to non-pinned base image packages
  && apt-get dist-upgrade -y \
  && apt-get autoremove -y \
  && apt-get clean \
  && rm -rf \
    /var/lib/apt/lists/* \
    /tmp/* \
    /var/tmp/*

ENV SHELL=/bin/bash
ENV PATH="$PATH:/root/.local/bin"

ARG commit_ref=main

HEALTHCHECK CMD dbt --version || exit 1

WORKDIR /usr/app/dbt/
ENTRYPOINT ["dbt"]

RUN curl -fsSL https://public.cdn.getdbt.com/fs/install/install.sh | sh -s -- --update


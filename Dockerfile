FROM ruby:3.1-alpine

RUN apk add --update --no-cache git nodejs build-base
WORKDIR /app
COPY Gemfile* .
RUN bundle install

EXPOSE 4567

#!/bin/bash -eo pipefail

bundle install
bundle exec middleman build
aws s3 cp --recursive build/ s3://com.getdbt.hub/
aws cloudfront create-invalidation --distribution-id E39VJ0QVYMOHEU --paths *

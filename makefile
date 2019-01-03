
serve:
	bundle exec middleman serve --port 4567

install:
	bundle install

deploy:
	bundle install
	bundle exec middleman build

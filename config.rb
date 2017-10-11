require 'open-uri'

set :js_dir, 'dbt-site/ui/'

activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

data.packages.each do |name, package|
  proxy "/api/v1/#{name}.json",
        '/api/v1/package.template.json',
        :locals => { :package => package }

  proxy "/#{name}/latest",
        '/package.template.html',
        :layout => 'layout',
        :locals => {
          :package => package,
          :version => package.versions[package.latest]
        }

  proxy "/#{package.namespace}",
        '/author.template.html',
        :layout => 'layout',
        :locals => { :author => package.namespace }

  package.versions.each do |version, package_version|
    proxy "#{name}/#{version}",
          "/package.template.html",
          :layout => "layout",
          :locals => {
            :package => package,
            :version => package_version
          }

    proxy "/api/v1/#{name}/#{version}.json",
          '/api/v1/raw.json',
          :locals => { :json_data => package_version }
  end
end

set :protocol, 'https://'
set :host, 'hub.getdbt.com'
set :port, 443

helpers do
  def host_with_port
    [config[:host], optional_port].compact.join(':')
  end

  def optional_port
    config[:port] unless [80, 443].include? config[:port].to_i
  end

  def site_url
    config[:protocol] + host_with_port
  end
end

ignore '/package.template.html.erb'
ignore '/author.template.html.erb'
ignore '/api/v1/package.template.json.erb'
ignore '/api/v1/raw.json.erb'

activate :livereload

configure :development do
  set :host, '127.0.0.1'
  set :port, Middleman::LiveReloadExtension.config.port
  set :protocol, 'http://'
end

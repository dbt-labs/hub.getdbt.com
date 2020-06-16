require 'open-uri'

ignore 'www.getdbt.com/'
ignore 'source/img'

set :js_dir, 'javascripts'
set :images_dir, 'images'


activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

def strip_leading_v(version)
    if version.start_with?("v")
      version[1..-1]
    else
      version
    end
end

def _build_package(package, org, name)
    entry = package['index'].clone
    versions = package['versions']

    new_versions = {}
    versions.each do |version_num, version_data|
        version_num = strip_leading_v(version_num)
        version_data['version'] = strip_leading_v(version_data['version'])

        new_versions[version_num] = version_data
    end
    entry['versions'] = new_versions
    entry
end

def combine_packages(packages)
  package_map = {}
  packages.each do |org, org_packages|
      org_packages.each do |name, package|
          entry = _build_package(package, org, name)

          package_map[name] = entry
      end
  end

  package_map
end

set :package_index, combine_packages(@app.data.packages)

after_configuration do

  proxy "/api/v1/packages.json",
        '/api/v1/raw.json',
        :content_type => 'application/json',
        :locals => {
          :json_data => @package_index
        }

  packages = combine_packages(@app.data.packages)
  packages.each do |package_name, package|
      name = "#{package['namespace']}/#{package_name}"
      proxy "/#{name}/latest/index.html",
            '/package.template.html',
            :content_type => 'text/html',
            :layout => 'layout',
            :locals => {
              :package => package,
              :version => package.versions[package.latest]
            }

      proxy "/#{package.namespace}/index.html",
            '/author.template.html',
            :content_type => 'text/html',
            :layout => 'layout',
            :locals => {
              :author => package.namespace
            }

      proxy "/api/v1/#{name}.json",
            '/api/v1/package.template.json',
            :content_type => 'application/json',
            :locals => {
              :package => package
            }

      package.versions.each do |version, package_version|
        proxy "#{name}/#{version}/index.html",
              "/package.template.html",
              :layout => "layout",
              :content_type => 'text/html',
              :locals => {
                :package => package,
                :version => package_version
              }

        proxy "/api/v1/#{name}/#{version}.json",
              '/api/v1/raw.json',
              :content_type => 'application/json',
              :locals => {
                :json_data => package_version
              }
      end
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

  def is_hidden(package, version)
    version['version'] != package.latest or @app.data.blocklist.include?(package.name)
  end
end

ignore '/package.template.html.erb'
ignore '/author.template.html.erb'
ignore '/api/v1/package.template.json.erb'
ignore '/api/v1/raw.json.erb'

activate :livereload

configure :development do
  set :host, '127.0.0.1'
  set :port, 35729
  set :protocol, 'http://'
end

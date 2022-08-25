require 'open-uri'

class Middleman::Util::EnhancedHash
    # Mila: Looked into Hashie::Mash's source code where this class is
    # defined (Middleman merely mixes it in). disable_warnings is the
    # advertised way to turn off key conflict warnings which we probably
    # cannot avoid in this project -- each package we host includes a file
    # named index.json which is treated as a property. This in turn
    # conflicts with Ruby's builtin [] (Array#index) method
    disable_warnings
end

ignore 'www.getdbt.com/'
ignore 'source/img'

set :js_dir, 'javascripts'
set :images_dir, 'img'


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

          qualified_name = "#{org}/#{name}"
          package_map[qualified_name] = entry
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
      proxy "/#{package_name}/latest/index.html",
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

      proxy "/api/v1/#{package_name}.json",
            '/api/v1/package.template.json',
            :content_type => 'application/json',
            :locals => {
              :package => package
            }

      redirect "#{package_name}/index.html", to: "/#{package_name}/latest/index.html"

      package.versions.each do |version, package_version|
        proxy "#{package_name}/#{version}/index.html",
              "/package.template.html",
              :layout => "layout",
              :content_type => 'text/html',
              :locals => {
                :package => package,
                :version => package_version
              }

        proxy "/api/v1/#{package_name}/#{version}.json",
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
    @app.data.blocklist.organizations.include?(package.namespace) or @app.data.blocklist.packages.include?(package.namespace + "/" + package.name)
  end

  def is_latest(package, version)
    package.latest == version['version']
  end  

  def is_valid_github_url(url)
    url.split("/tree/").length == 2 && url.split("/").length >= 5
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

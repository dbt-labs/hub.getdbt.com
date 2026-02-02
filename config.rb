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

activate :directory_indexes

activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

# Shared helper methods available to both config and templates
module SiteHelpers
  PackageStub = Struct.new(:namespace, :name)

  def strip_leading_v(version)
    version.start_with?("v") ? version[1..-1] : version
  end

  def build_package(package, org, name)
    entry = package['index'].clone
    versions = package['versions']

    new_versions = {}
    versions.each do |version_num, version_data|
      version_num = strip_leading_v(version_num)
      version_data['version'] = strip_leading_v(version_data['version'])
      version_data['blocklisted'] = is_hidden(PackageStub.new(org, name), nil)
      new_versions[version_num] = version_data
    end
    entry['versions'] = new_versions
    entry
  end

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
    @app.data.blocklist.organizations.include?(package.namespace) || 
      @app.data.blocklist.packages.include?(package.namespace + "/" + package.name)
  end

  def is_latest(package, version)
    package.latest == version['version']
  end

  def is_valid_github_url(url)
    url.split("/tree/").length == 2 && url.split("/").length >= 5
  end

  def is_fusion_compatible(package, version_to_check = nil)
    # If no version specified, check the latest
    version = version_to_check ? version_to_check['version'] : package.latest
    
    return false unless package.versions && package.versions[version]
    
    version_data = package.versions[version]
    requirements = version_data['require_dbt_version']
    
    return false if requirements.nil?
    return false if requirements.is_a?(Array) && requirements.empty?
    return false if requirements.is_a?(String) && requirements.strip.empty?
    return false unless requirements.is_a?(Array) || requirements.is_a?(String)
    
    begin
      requirement = Gem::Requirement.new(requirements)
      dbt_2_0 = Gem::Version.new('2.0.0')
      requirement.satisfied_by?(dbt_2_0)
    rescue StandardError
      false
    end
  end
end

# Make helpers available in config scope
include SiteHelpers

def combine_packages(packages)
  package_map = {}
  packages.each do |org, org_packages|
    org_packages.each do |name, package|
      entry = build_package(package, org, name)
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

  proxy "/api/v1/blocklist.json",
        '/api/v1/raw.json',
        :content_type => 'application/json',
        :locals => {
          :json_data => @app.data.blocklist
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

# Make helpers available to templates
helpers SiteHelpers

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

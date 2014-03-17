class midas_config {
  require midas_sails

  # Copy the main settings files and edit them
  file { "/vagrant/config/local.js":
    ensure => "file",
    source => "/vagrant/config/local.ex.js"
  }

  # Copy and edit the backend module configuration files
  file { "/vagrant/config/settings/auth.js":
    ensure => "file",
    source => "/vagrant/config/settings/auth.ex.js"
  }

  file { "/vagrant/config/settings/sources.js":
    ensure => "file",
    source => "/vagrant/config/settings/sources.ex.js"
  }

  file { "/vagrant/config/settings/tags.js":
    ensure => "file",
    source => "/vagrant/config/settings/tags.ex.js"
  }

  # Compile production JS and CSS
  exec { 'make_build':
    command   => "make build",
    cwd       => "/vagrant",
    timeout   => 0,
    unless    => ["ps -ef | grep '[f]orever'", "sudo -u postgres psql -d midas -c \"select id from midas_user where username='initialize' and disabled=true;\" | grep -q 1
"]
  }

  # Initialize the database
  #TODO how to 'Edit the configuration file at test/init/init/config.js to match your tags in assets/js/backbone/components/tag.js' ??
  exec { 'run_tests':
    command   => "make init",
    cwd       => "/vagrant",
    timeout   => 0,
    before    => Exec['make_build'],
    unless    => ["ps -ef | grep '[f]orever'"]
  }
}

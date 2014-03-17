import "midas_nodejs"
import "midas_postgres"
import "midas_sails"
import "midas_config"

node "devel" {
  user {'midas':
    groups => ['sudo'],
    ensure => present,
    shell => '/bin/false',  #prevent user from logging in?
  }

  Exec {
      path => [ "/bin/", "/sbin/" , "/usr/bin/", "/usr/sbin/", "/usr/local/node/node-default/bin/" ],
      timeout   => 0,
  }

  class { 'apt':
    always_apt_update    => true,
    disable_keys         => undef,
    proxy_host           => false,
    proxy_port           => '8080',
    purge_sources_list   => false,
    purge_sources_list_d => false,
    purge_preferences_d  => false,
    update_timeout       => undef
  }

  #Set system timezone to UTC
  class { "timezone":
    timezone => 'UTC',
  }

  include midas_nodejs
  include midas_postgres
  include midas_sails
  include midas_config

  exec { 'start':
    command   => "forever start app.js",
    cwd       => "/vagrant",
    require   => Class['midas_config'],
    unless    => "ps -ef | grep '[f]orever'"
  }
}

class midas_sails {
  require midas_postgres, midas_nodejs

  file { "/usr/local/share/sails-postgresql":
    ensure => "directory",
    owner  => "vagrant",
    group  => "vagrant",
    mode   => 750,
    purge  => true, # purge all unmanaged junk
    force  => true, # also purge subdirs and links
    recurse => true, # honestly don't know diff b/t this and purge

  }

  $packagedep = ['make', 'g++']
  package {$packagedep:
    ensure => 'installed',
    before => Exec['npm_sails_install'],
  }

  exec { 'git_clone_sails':
    command   => "git clone https://github.com/Innovation-Toolkit/sails-postgresql.git .",
    cwd       => "/usr/local/share/sails-postgresql",
    require  => File['/usr/local/share/sails-postgresql'],
  }

  exec { 'git_sails_checkout':
    command   => "git checkout bytea",
    cwd       => "/usr/local/share/sails-postgresql",
    require  => Exec['git_clone_sails'],
  }

  exec { 'npm_sails_install':
    command   => "npm install",
    cwd       => "/usr/local/share/sails-postgresql",
    require  => Exec['git_sails_checkout'],
  }

  exec { 'npm_sails_link':
    command   => "npm link",
    cwd       => "/usr/local/share/sails-postgresql",
    require  => Exec['npm_sails_install'],
  }

  exec { 'npm_midas_link':
    command   => "npm link sails-postgresql",
    cwd       => "/vagrant",
    require  => Exec['npm_sails_link'],
  }

  exec { 'npm_midas_install':
    command   => "npm install",
    cwd       => "/vagrant",
    require  => Exec['npm_midas_link'],
  }

}

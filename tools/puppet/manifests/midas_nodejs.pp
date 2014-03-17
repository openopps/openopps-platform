import "midas_sails"

class midas_nodejs {

  #Install Node and NPM. may want make install to be true in future
  class { 'nodejs':
      version => 'v0.10.25',
      make_install => false,
  }

  $packages = ['python2.7']
  package {$packages:}

  package {'grunt-cli':
    provider    => 'npm',
  }

  package {'forever':
    provider  => 'npm',
  }
}

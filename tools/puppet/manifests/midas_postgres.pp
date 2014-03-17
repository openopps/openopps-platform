#Install PostGreSQL Database
class midas_postgres {

    class { 'concat::setup':
      before => Class['postgresql::globals'],
    }

    class { 'postgresql::globals':
      manage_package_repo => true,
      version             => '9.2',
      encoding            => 'UTF8',
      locale              => 'en_US.UTF-8',
    }

    #Install and Configure database
    class { 'postgresql::server':
      ip_mask_deny_postgres_user => '0.0.0.0/32',
      ip_mask_allow_all_users    => '0.0.0.0/0',
      listen_addresses           => '*',
      ipv4acls                   => ['hostssl all midas 192.168.0.0/24 cert'],
      manage_firewall            => false,
      postgres_password          => 'midaspassword',
      require             => Class['postgresql::globals'],
    }

    postgresql::server::db { 'midas':
      user     => 'midas',
      password  => 'midas',
      grant     => 'all',
    }

    ->exec {'alter_schema':
      command   => 'psql -c "ALTER SCHEMA public OWNER TO midas;" midas',
      user => "postgres",
    }

    #This is for development only db client and server on same host
    postgresql::server::pg_hba_rule { "allow application to access local database":
        type        => "local",
        database    => "all",
        user        => "all",
        auth_method => md5,
    }

    class { 'postgresql::lib::devel':
     package_name => 'postgresql-server-dev-9.2'
    }
}




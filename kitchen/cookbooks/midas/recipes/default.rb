include_recipe 'postgresql'
include_recipe 'postgresql::server'
include_recipe 'postgresql::pg_user'
include_recipe 'postgresql::pg_database'
include_recipe 'nginx'

package 'git'
include_recipe 'nodejs'
include_recipe 'nodejs::npm'

include_recipe 'midas::sails-postgresql'
include_recipe 'midas::app'

package 'graphicsmagick'


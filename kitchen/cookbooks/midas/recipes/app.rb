install_dir = '/var/www/midas'

directory install_dir do
  recursive true
end

git install_dir do
  repository 'https://github.com/18F/midas.git'
  revision 'devel'
  action :sync
end

execute 'install code dependencies' do 
  command <<-HERE
    git submodule --init
    npm install -g grunt-cli
    npm install -g forever 
    npm link sails-postgresql
    npm install
  HERE
  cwd install_dir
end



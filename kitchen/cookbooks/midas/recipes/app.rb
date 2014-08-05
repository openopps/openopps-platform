install_dir = '/var/www/midas'

directory install_dir do
  recursive true
end

git install_dir do
  repository 'https://github.com/18F/midas.git'
  revision 'devel'
  enable_submodules true
  action :sync
end

execute 'install code dependencies' do 
  command <<-HERE
    npm install -g grunt-cli
    npm install -g forever 
    npm link sails-postgresql
    npm install
    make build
  HERE
  cwd install_dir
end

execute 'config' do
 command <<-HERE
  cp local.ex.js local.js
 HERE
  cwd "#{install_dir}/config"
end

bash 'settings' do
 code <<-HERE
  for file in *.ex.js; do cp "$file" "${file/ex./}"; done
 HERE
  cwd "#{install_dir}/config/settings"
end

bash 'nginx config' do
 code <<-HERE
   sudo ln -s /var/www/midas/tools/nginx/sites-enabled.default midas 
 HERE
  cwd "/etc/nginx/sites-enabled"
end

bash 'startup' do
 code <<-HERE
    make init
    make demo
    forever start app.js --prod
    sudo service nginx start
 HERE
  cwd install_dir
end

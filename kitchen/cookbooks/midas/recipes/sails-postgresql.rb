package_dir = "/opt/node-packages/sails-postgresql"

directory package_dir do
  recursive true
end

git package_dir do
  repository "https://github.com/Innovation-Toolkit/sails-postgresql.git"
  revision 'bytea'
  action :sync
end

execute "install sails-postgresql" do
  command <<-HERE
    npm install
    npm link
  HERE
  cwd package_dir
end

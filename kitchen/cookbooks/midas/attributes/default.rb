default.postgresql.database.name = 'midas' 
default.postgresql.database.encoding = 'unicode'
default.postgresql.databases = [
  { name: 'midas', owner: 'midas' }
]
default.postgresql.users = [
  {
    username: "midas",
    password: "midas",
    superuser: false,
    createdb: true,
    login: true
  }
]
default.postgresql.pg_hba = [
#  {
#    type: 'local',
#    db: 'all',
#    user: 'all',
#    addr: '',
#    method: 'md5' 
#  },
  {
    type: 'hostssl',
    db: 'all',
    user: 'all',
    addr: '0.0.0.0/0',
    method: 'md5' 
  }
]
default.postgresql.password = ''

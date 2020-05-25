Installation
=====
- [Step by Step Installation from Source](#step-by-step-installation-from-source)
    - [Mac OSX](#mac-osx)
    - [Linux (Ubuntu 12.04 LTS)](#linux-ubuntu-1204-lts)
    - [Windows](#windows-windows-2008-server)
    - [All Platforms](#all-platforms)
- [For development](#for-development)
- [For production](#for-production)
- [Host and Configure Application](#host-and-configure-application)
- [Troubleshooting Cross Platform Issues](#troubleshooting-cross-platform-issues)

## Step by Step Installation from Source
The following installation steps for Mac, Linux, and Windows can be used for setting up a development or production environment manually.

### Mac OSX
The instructions have been tested on 10.15.4, but earlier versions likely work.  Also, to follow these steps you will need:
* the popular [brew](http://brew.sh/) package manager
* XCode (free via Mac AppStore)

In the Terminal:

You'll need an older version of ElasticSearch at the moment.
    brew install elasticsearch@5.6

And PostgreSQL:
    brew install postgresql

Next, create the `midas` database:

    initdb /usr/local/var/postgresql

Success. You can now start the database server using:

    postgres -D /usr/local/var/postgresql
    or
    pg_ctl -D /usr/local/var/postgresql -l logfile start

When you run either of these commands it will start running the server. It's best to choose the first choice (postgres -D /usr/local/var/postgresql) so if you work on a different tab in your terminal the server will keep running. Next in the Terminal:

    createdb midas

Start the postgres console acting on the `midas` database with: `psql midas`

    CREATE USER midas WITH PASSWORD 'midas';
    GRANT ALL PRIVILEGES ON DATABASE midas to midas;
    ALTER SCHEMA public OWNER TO midas;
    \q

Install node.js. The example commands below use [nvm](https://github.com/creationix/nvm) which is not required, but we find helpful
to manage Node versions, when working other Node projects.

So back to the command line. We assume that nvm is installed and set up
(added to `.bashrc` or equivalent).

    nvm install 8.9.0
    nvm alias default 8.9.0
    nvm version             # should be v8.9.0

Then follow platform-independent steps below starting at [clone the git repository](#clone-the-git-repository).

### Linux (Ubuntu 12.04 LTS)

#### Set your system's timezone to UTC

     sudo echo "UTC" | sudo tee /etc/timezone
     sudo dpkg-reconfigure --frontend noninteractive tzdata

#### Get prerequisite packages

     sudo apt-get install -y python-software-properties python g++ make git

#### Install Postgres 9.2+ and remove any Ubuntu installed earlier version

     sudo add-apt-repository -y ppa:pitti/postgresql
     sudo apt-get update
     sudo apt-get remove postgresql
     sudo apt-get remove postgresql-9.1
     sudo apt-get remove postgresql-client-9.1
     sudo apt-get remove postgresql-doc-9.1
     sudo rm -rf /etc/postgresql/9.1
     sudo apt-get install -y --force-yes postgresql-9.2
     sudo apt-get install -y --force-yes postgresql-server-dev-9.2

After installing postgres, you may want to modify the configuration settings so that local applications can make connections to the database server.

Modify `pg_hba.conf` in `/etc/postgresql/*/main` (`-` is for lines to be removed and `+` is for lines to be added, like a diff):

     # "local" is for Unix domain socket connections only
     -local   all             all                                     peer
     +local   all             all                                     md5

For connections outside `localhost`, modify `postgresql.conf`:

     -#listen_addresses = 'localhost'
     +listen_addresses = '*'

AND modify `pg_hba.conf`:

     # IPv4 local connections:
     -host    all             all             127.0.0.1/32            md5
     +hostssl    all             all             0.0.0.0/0               md5

#### Create the database

     sudo -u postgres createdb midas
     sudo -u postgres psql -c "CREATE USER midas WITH PASSWORD 'midas';"
     sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE midas to midas;"
     sudo -u postgres psql -c "ALTER SCHEMA public OWNER TO midas;" midas

#### Install node.js

     sudo add-apt-repository -y ppa:chris-lea/node.js
     sudo apt-get update
     sudo apt-get install nodejs

### Windows (Windows 2008 Server)

#### Install Visual C++ 2008 x64 or x86 Redistributable Package

[Runtime 64](http://www.microsoft.com/en-us/download/details.aspx?id=15336)
  or
[Runtime 32](http://www.microsoft.com/en-us/download/details.aspx?id=29)

Reboot server once finished

#### Install/Configure Postgres 9.2+ via windows msi installer

[PostgreSQL](http://www.postgresql.org/download/windows/`)

Establish admin user account during the wizard and verify that PostgreSQL is running as a service

Open pgAdmin

Create database 'midas', user account 'midas' with password 'midas', and assign user 'midas' full rights to administer DB 'midas'

#### Install Node.js via Windows MSI, select all available add-ons

[Node.js](https://nodejs.org/en/download/)

#### Set System Path Variables

Go to Control Panel -> System -> Advanced System Settings -> Environment Variables
Find "Path" Variable in System Variables table and double click to edit it. Make sure it contains all of the following parts (in    addition to anything else) separated by a semi-colon.

    DRIVE:\Program Files\nodejs\;

Save.

### All Platforms

#### Optional: Installing the Open Opportunities Theme

Typically we do development without the theme.  Tests are designed
to run without the theme, which sets up alternate configuration.

This theme is contained in [a separate repository] [openopps_theme_repo]. To
hook into the `npm preinstall` hook's theme copy mechanism, you must have an
environment variable pointing the Github URL to the `$THEME` variable.
Here's an example using `export`:

    export THEME="https://github.com/18F/open-opportunities-theme.git" && \
    npm install

[openopps_theme_repo]: https://github.com/18F/open-opportunities-theme "Open Opportunities Theme"

Note: the tests don't currently pass when the theme is installed since it
also changes configuration.

#### Clone the git repository.

     git clone https://github.com/18F/openopps-platform.git
     cd openopps-platform

#### Install openopps node packages (from the openopps git folder)

Run the Node Package Installer (npm) to fetch dependencies:

     npm install

#### Optional: Edit the configuration files

See the [Configuration Guide](CONFIG.md)

#### Setup the database

From the root of the openopps directory, initialize the database:

     npm run migrate:up
     npm run init

If you'd like to include a sample project and users, also run:

     npm run demo

This also creates a handful of initial users. By default all those users are disabled, and none are admin.
It's usually helpful to have at least one admin user (we picked "Alan Barret") so these commands are
helpful:

     psql midas
     update midas_user set disabled='f';
     update midas_user set "isAdmin"='t' where username='alan@test.gov';

Note the quotes around "isAdmin". Postgres by default lowercases all non-keywords, which includes column names.

Now you are ready to rock!

---------------------------------------

## For development

Run the tests (all should pass)

    export VCAP_APPLICATION='{ "uris": [ "openopps-test.18f.gov" ] }'
    npm test

Run the server (watch client files, compiling if needed)

    export SAILS_SECRET='RANDOM_BITS_FOR_SAILS_SESSIONS_ID'
    export VCAP_APPLICATION='{ "uris": [ "openopps-test.18f.gov" ] }'
    npm run watch


Go to [http://localhost:3000](http://localhost:3000) to see the app

Check out the [Contributor's Guide](CONTRIBUTING.md) for next steps

#### Troubleshooting

On Mac OSX, you may receive a stream of

    Error: EMFILE, too many open files

messages after running `npm start`. This is an issue with OSX and Grunt; there are directions to fix the issue [here](https://github.com/gruntjs/grunt-contrib-copy/issues/21) or [here](http://unix.stackexchange.com/questions/108174/how-to-persist-ulimit-settings-in-osx-mavericks).

---------------------------------------

## For production

#### Compile production JS and CSS (from the openopps git folder)

     npm run build

#### Initialize the database (once)

     npm run init

### Start the forever server (from the openopps git folder)

Install forever with from npm:

     sudo npm install -g forever

This will run the application server on port 1337

     forever start app.js --prod

You can now access the server at `http://localhost:1337`

#### Optional: install nginx

     sudo add-apt-repository -y ppa:nginx/stable
     sudo apt-get update
     sudo apt-get install nginx

Configure nginx with the files in the tools folder.  Use the SSL config file if you want to enable SSL, but be sure to set your SSL key.

     cd tools/nginx
     sudo cp sites-enabled.default /etc/nginx/sites-enabled/default
     sudo service nginx restart

With the application server running and nginx running, you should now be able to access the application at `http://localhost`

---------------------------------------

## Host and Configure Application

#### If hosting on an on-line server

Follow instructions as above in Linux Install Guide to retrieve necessary files from GitHub.

Install NPM Modules as directed above.

#### If hosting on an off-line server

Retrieve OpenOpps from GitHub as above on an online pc. Install NPM modules as directed. Copy to offline server your local npm_modules directory (in project home) as well as the contents of the directory found in Users/YOUR_USER_NAME/AppData/Roaming/npm to corresponding locations on offline-server.

#### Starting OpenOpps

Navigate to OpenOpps directory via windows cmd.exe prompt

Enter the following commands

   npm install

Start Midas with

     npm start

You can now access the server at `http://localhost:1337`

## Troubleshooting Cross Platform Issues

#### `Unable to parse HTTP body- error occurred ::`

Having an error on `npm start` which begins the Sails server with an error along
the lines of the following:

    error: Unable to parse HTTP body- error occurred :: { [error: relation "<TABLE_NAME>" does not exist] name: 'error',}

Can mean that your database is corrupt or misconfigured. A potential fix is to
clean your database using the scripts found in `tools/postgres`. **This will
delete everything in your database**.

    ./tools/postgres/cleandb.sh

Once that's done, you need to run `npm run init` again.

You can also verify that the correct `midas` user exists for the `<TABLE_NAME>`.

```sql
ALTER TABLE session OWNER TO midas;
---                          ^^^^^
```

This should also work if you run into issues with other tables.

```sql
ALTER TABLE * OWNER TO midas;
---                    ^^^^^
```

#### Initialize the Elastic Search Indexes

If the search pages are stuck with a spinning loader, then it is likely that the ElasticSearch index is not up to date. To reindex the data, you will need to send a request to `api/user/re
index` or `api/task/reindex` while authenticated as an admin user.

The easiest way to do this is:
1. Log in to the site with an admin user.
1. Open the browser's developer tools
1. Open the network tab, and right click on an api request that was sent after the authenticat
ion was completed.
1. Copy the request as a cURL command.
1. Paste the cURL command into a terminal window, updating the path to `api/user/reindex` and
executing it.
1. Refresh the browser.


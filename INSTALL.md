Installation
=====
- [Deploy OpenOpps as a Docker Container from the Docker Hub](#deploy-openopps-as-a-docker-container-from-the-docker-hub-mac-windows-linux)
- [Step by Step Installation from Source](#step-by-step-installation-from-source)
    - [Mac OSX](#mac-osx)
    - [Linux (Ubuntu 12.04 LTS)](#linux-ubuntu-1204-lts)
    - [Windows](#windows-windows-2008-server)
    - [All Platforms](#all-platforms)
- [For development](#for-development)
- [For production](#for-production)
- [Host and Configure Application](#host-and-configure-application)
- [Troubleshooting Cross Platform Issues](#troubleshooting-cross-platform-issues)



## Deploy OpenOpps as a Docker Container from the Docker Hub (Mac, Windows, Linux):

1. Download and install the [Docker Toolbox](https://www.docker.com/toolbox)
2. Open Kitematic on your Mac (it's installed with the Docker Toolkit), search for "open-opps", and click create:
  ![screen shot 2015-08-27 at 11 12 21 am](https://cloud.githubusercontent.com/assets/170641/9524361/8e21aba6-4cac-11e5-9e45-07c1d4450d13.png)
3. You'll see the log of OpenOpps starting up. (You may need to wait a minute for the application to start up.) Click the arrow next to "Web Preview" to open up OpenOpps in your browser:
  ![screen shot 2015-08-27 at 11 13 27 am](https://cloud.githubusercontent.com/assets/170641/9524382/af4dc864-4cac-11e5-89df-1f4290e6b2fb.png)
4. You're now running OpenOpps in a local container and you can do all the things you'd usually do with it
  ![screen shot 2015-08-27 at 11 14 13 am](https://cloud.githubusercontent.com/assets/170641/9524433/f2adb3ee-4cac-11e5-9068-5e2d2de67631.png)
  ![screen shot 2015-08-27 at 11 14 19 am](https://cloud.githubusercontent.com/assets/170641/9524434/f46fe6a2-4cac-11e5-88fd-cdee0517ed46.png)
  ![screen shot 2015-08-27 at 11 14 49 am](https://cloud.githubusercontent.com/assets/170641/9524437/f61f4bbe-4cac-11e5-86b4-75b482a462fa.png)
5. **Bonus:** you can try our other branches of OpenOpps (useful for reviewing pull requests). Get the branch  name from GitHub:

  ![screen shot 2015-08-27 at 11 16 27 am](https://cloud.githubusercontent.com/assets/170641/9524463/180170a4-4cad-11e5-9ed4-d7d3a4a253f2.png)
6. Go back to "Settings" in Kitematic, set the `BRANCH` environment variable, and click "Save":
  ![screen shot 2015-08-27 at 11 17 08 am](https://cloud.githubusercontent.com/assets/170641/9524485/2fd9ea94-4cad-11e5-9a8d-09322c46a857.png)
7. Now on "Home", you'll see the log of OpenOpps rebuilding with the new branch. Give it a chance to build, then relaunch the web preview to try the new branch

### Docker for Development

After installing docker, as above, you can use it for development, by syncing a local directory with the virtual container.

First, grab the code and clone onto your local machine.

```
git clone git@github.com:18F/openopps-platform.git docker-openopps
cd docker-openopps
```

Note: I've created a different directory name to remind myself that this code
that will run in Docker.  I will be configuring this and installing modules for
the Docker environment, which is different than my local machine.

Run Kitematic, and choose menu `File` > `Open Docker Command-Line Terminal`

Then on the command-line:

```
docker login
docker pull 18fgsa/open-opps
docker run -Pti  -v `pwd`:/usr/src/app --entrypoint=/bin/bash --name local-opps 18fgsa/open-opps
```

Every once in a while, there's a timeout when executing this command multiple
times.  If that happens, resetting the environment can fix it:

```
docker-machine restart default  # Restart environment
eval $(docker-machine env default)  # Refresh environment settings
```

Now, with your Docker machine running and synced to your local directory,
run the following commands in the interactive terminal (which runs them
in the Docker machine):

```
npm i -g npm@3
npm install -g node-gyp@3.3.1 grunt-cli@0.1.13
npm install
npm run init
npm start
```

Now you can see your local code run in the Docker container.  You can modify
the code locally and stop and start the server to see changes.

## Step by Step Installation from Source
The following installation steps for Mac, Linux, and Windows can be used for setting up a development or production environment manually.

### Mac OSX
The instructions have been tested on 10.9.2, but earlier versions likely work.  Also, to follow these steps you will need:
* the popular [brew](http://brew.sh/) package manager
* XCode (free via Mac AppStore)

In the Terminal:

    brew install postgresql
    brew install graphicsmagick

When Homebrew is done installing Postgres, follow the instructions at the end to start Postgres.

Next, create the `midas` database:

    initdb /usr/local/var/postgresql

Once you're done installing you'll see two options:
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

Install node.js. As of Feb 2015 Node.js has moved to 0.12 for its stable version. But many dependencies, especially native compiled packages, don't work with 0.12 yet. So consider running Node.js 0.10.  Consider using [nvm](https://github.com/creationix/nvm) to manage Node versions. Once installed and sourced into your environment nvm can handle manage versions.

So back to the command line. We assume that nvm is installed and set up
(added to `.bashrc` or equivalent).

    nvm install 4.2.2
    nvm alias default 4.2.2
    nvm version             # should be v4.2.2

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

#### Install GraphicsMagick

     sudo apt-get install graphicsmagick

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

[Node.js](http://nodejs.org/dist/v4.2.2/)

Use npm version 3.x

```
npm i -g npm@3
```

#### Install GraphicsMagick

[GraphicsMagick](ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/windows/`)

Select Q8 version along with latest corresponding to 32 bit vs. 64 bit OS

#### Set System Path Variables

Go to Control Panel -> System -> Advanced System Settings -> Environment Variables
Find "Path" Variable in System Variables table and double click to edit it. Make sure it contains all of the following parts (in 	addition to anything else) separated by a semi-colon.

	DRIVE:\program files\graphicsmagick-1.3.18-q8;
	(or similar, depending on your graphicsmagick version)
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

Then install npm 3.x and run the normal npm package installer

     npm i -g npm@3
     npm install -g node-gyp@3.3.1 grunt-cli@0.1.13
     npm install

#### Optional: Edit the configuration files

See the [Configuration Guide](CONFIG.md)

#### Setup the database

From the root of the openopps directory, initialize the database:

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
This doesn't play nicely with our schema.


Now you are ready to rock!

---------------------------------------

## For development

Run the tests (all should pass)

    npm test

Run the server (watch client files, compiling if needed)

    npm run watch


Go to [http://localhost:1337](http://localhost:1337) to see the app

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

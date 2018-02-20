FROM node:carbon

RUN apt-get update && \
  apt-get install -y postgresql-client graphicsmagick && \
  apt-get install vim -y

# if we run npm install as root, it causes a warning
# so we set up a user and group for the app
ENV USER openopps
ENV GROUP openopps
ENV HOME /home/$USER
RUN groupadd -r $GROUP
RUN useradd -g $GROUP --create-home --home-dir $HOME $USER \
    && mkdir -p $HOME/app

WORKDIR $HOME/app

# # Bundle app source
COPY . .

# # copy ignores USER directive, so fix ownership
RUN chown -R $USER:$GROUP ./

USER $USER
RUN npm install
RUN npm run setup


ENV TEST_DATABASE_URL postgresql://$RDS_USERNAME:$RDS_PASSWORD@$RDS_HOSTNAME:$RDS_PORT/$RDS_DB_NAME

EXPOSE 3000
CMD [ "node", "app.js" ]

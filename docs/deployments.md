# Deploying OpenOpps

## local build

```
docker build .
```

## local docker environment

uses docker compose



## AWS

ElasticBeanstalk notes
- builds image from root Dockerfile
- uses source checked into git
- .elasticbeanstalk directory is in .gitignore, so we can have diff local env

### Devops Tips

- Add yourself to the docker group, log out, and then log back in to ensure that you can run Docker commands without sudo: `sudo usermod -a -G docker $USER` --[eb docs](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_docker-eblocal.html)


### When it doesn't work

If `eb deploy` fails:
* `eb health` shows instance that fails
* `eb logs --instance <instance-id>`

You can also run the image interactively:

```
eb ssh
docker ps -a    # see list of containers and images
docker run -it 4c5c5a084ab7     # specify image from failed container
```
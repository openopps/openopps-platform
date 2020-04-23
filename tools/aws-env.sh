#!/bin/bash

if [ -z $1 ]; then
  echo ""
  echo "usage: aws-env.sh <spacename>";
  echo ""
  exit 0;
fi
SPACE=$1
echo "capturing AWS credentials for space: ${SPACE}"

cf target -s $SPACE

CF_ENV=$(cf env openopps)
AWS_ACCESS_KEY=`echo "${CF_ENV}" | grep "access_key_id" | cut -d "\"" -f 4`
AWS_SECRET_KEY=`echo "${CF_ENV}" | grep "secret_access_key" | cut -d "\"" -f 4`

cat >.env-aws-$SPACE.sh <<EOL
#!/bin/bash
export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY
EOL
chmod a+x ".env-aws-$SPACE.sh"


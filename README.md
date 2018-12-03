# Hyperledger Composer - Bidding service

Bidding Service Project written against the Hyperledger Composer
for pilot project

## 1. Prerequisites
* Ubuntu Linux 14.04 / 16.04 LTS (both 64-bit), or Mac OS 10.12
* Docker Engine: Version 17.03++
* Docker-Compose: Version 1.8++
* Node: 8.9++ (<9.0)
* npm: v5.x
* git: 2.9.x++
* Python: 2.7.x


## 2. Install Components
```
$ npm install -g composer-cli@0.19
$ npm install -g composer-rest-server@0.19
$ npm install -g generator-hyperledger-composer@0.19
$ npm install -g yo
$ npm install -g composer-playground@0.19
```

## 3. Install Fabric
```
$ mkdir ~/fabric-dev-servers && cd ~/fabric-dev-servers
$ curl -O https://raw.githubusercontent.com/hyperledger/composer-tools/master/packages/fabric-dev-servers/fabric-dev-servers.tar.gz
$ tar -xvf fabric-dev-servers.tar.gz
$ cd ~/fabric-dev-servers
$ export FABRIC_VERSION=hlfv11
$ ./downloadFabric.sh
```

##4. Start Fabric
```
$ cd ~/fabric-dev-servers
$ export FABRIC_VERSION=hlfv11
$ ./startFabric.sh
$ ./createPeerAdminCard.sh
```

##5. Start Playground
```
$ composer-playground
```
* http://localhost:8080/login


##6. Create Business Network Structure
```
$ yo hyperledger-composer:businessnetwork
```

##7. Generate Business Network Archive
```
composer archive create -t dir -n .
```

##8. Deploying Business Network
```
$ composer network install --card PeerAdmin@hlfv1 --archiveFile bidding-service@0.0.1.bna
$ composer network start --card PeerAdmin@hlfv1 --networkName bidding-service --networkVersion 0.0.1 --networkAdmin admin --networkAdminEnrollSecret adminpw
$ composer card import --file admin@bidding-service.card
$ composer network ping --card admin@bidding-service (check ok)
```

##9. Start Rest API Server
```
$ composer-rest-server
```

##10. Start Angular Application
```
$ cd bidding-service
$ yo hyperledger-composer:angular
$ cd angular-bidding-service
$ npm start
```

##11. Upgrade Business Network Archive
```
$ vi package.json
  5   "name": "bidding-service",
  6   "version": "0.0.2",
  7   "description": "hyperledger bidding service",
$ composer network install --card PeerAdmin@hlfv1 --archiveFile bidding-service@0.0.2.bna
$ composer network upgrade --card PeerAdmin@hlfv1 --networkName bidding-service --networkVersion 0.0.2

```
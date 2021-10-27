# CF-IAM

[Cloudflare](https://cloudflare.com "Cloudflare") provides a mode called "**Im under Attack**" for the security level of a zone.

This mode provides a high level of protection to the zone, requiring visitors to solve javascript challenges or captchas before they can enter the site.

In the event of an active ddos attack, this mode is widely used to additionally protect a site from an impact of the attack.

However, this mode does not have an automatic way to be turned on, it's always a local modification the site admin has to make in the event of an attack.

This is were **CF-IAM** comes into place. 

**CF-IAM** is a simple node application for automatically enabling [Cloudflares](https://cloudflare.com "Cloudflares") "***Im under Attack mode***" to mitigate the impact of an may accouring ddos attack, when the webserver exceeds a defined concurrent active connections limit.

Unlike other publicly available scripts, it focuses not on the CPU usage on the host, but on the concurrent connections currently active with the NGINX webserver.

This gives more flexibility and control, because a high CPU usage is not always caused by an attack.

Furthermore, it does not use any third party dependencides, it simply relies on the inbuild NodeJS http & https modules to keep things secure and simple.

The **IAM** ("***Im under Attack***") mode is enabled over [Cloudflares API](https://api.cloudflare.com/ "Cloudflares API").

Installation of **CF-IAM** is really simple.

**Note**: This setup is meant for linux environments only, technically the installation of nginx under windows is possible, however not recommended.

## Requirements

- NGINX
- NodeJS

## Setup

#### 1. Clone the repository
Execute the following command:

`git clone https://github.com/JanSchuerlein/cf-iam`

-------------

#### 2. Create VirtualHost "nginx_status"

- On your webserver machine, navigate to your **/etc/nginx/sites-enabled/** directory and create a file called "**nginx_status**"

- Inside the file add the following content:



    server {
	
        listen 127.0.0.1:80;
		
        server_name 127.0.0.1;
    
        location /nginx_status {
            stub_status;
        }
    }

- Restart your nginx webserver using the command:

`service nginx restart`

Dont worry, the virtualhost we create, willy only listen to "**127.0.0.1**" and is not reachable from anywhere else then localhost. 

The virtualserver block will serve the nginx inbuild **sub_status** module, which gives generel information and stats about the nginx server instance, including the current  active connections established.

**Note**: You may already have some custom configured virtualhosts, make sure that the new virtualhost is inline with your current setup and does not override or conflict with existing configurations.


------------



To verify that the created virtualhost works as expected, run the following command:

`curl http://127.0.0.1/nginx_status`

This should return something similar to this:



    Active connections: 1 
    server accepts handled requests
     1135 7156 1395 
    Reading: 0 Writing: 1 Waiting: 0

------------

#### 3. Create Cloudflare API Token

- Login to your [Cloudflare Dashboard](https://dash.cloudflare.com/profile "Cloudflare Dashboard") and navigate to your profile.
- Under the section "**API Tokens**", click on "**Create Token**"
- On the next page, under the section "**Create Custom Token**", click on "**Get started**"
- Under "**Permissions**", select "**Zone**" - "**Zone Settings**" - "**Edit**"
  On "**Zone Resources**", select "**Include**" - "**Specific zone**" -> Select your zone
- **Optional**: You can tighten up the security of your token by using the Client IP Address Filtering and a TTL.

**Copy the created API token**


------------



#### 4. Configure CF-IAM

All configuration required is made in the **index.js** file.

For simplicify I have not implemented a seperate config file.

Edit the file and replace the following lines with the required values:

```javascript
const zone = 'YOUR-CLOUDFLARE-ZONE-ID';
const token = 'YOUR-CREATED-API-TOKEN';
```

- Replace the const "zone" with your Cloudflare zone id
- Replace the const "token" with the created API token you just copied

```javascript
const connectionLimit = 500;
```

- Replace the connectionLimit value with whatever you find suitable for your use case
This value mainly depends on the normal active concurrent connections to your server
While some sites can have thousands of active connections, another site does not exceed a couple hundred

When the amount of current active connections exceeds the connectionLimit, the "**Im under attack mode**" will be turned on.


------------



**Remember**: 

Running **CF-IAM** from the command line will output the current active connections.

`node index.js`

You can also check the current statistics by executing the following curl command:

`curl http://127.0.0.1/nginx_status`


------------



#### 5. Setup Cron to automatically run CF-IAM

We now have everything in place to automatically turn on the "**Im under attack**" mode, when the active webserver connections are exceeding our defined limit.

Now the last thing we need is a cron that automatically runs **CF-IAM** periodically.

For that we open up crontab using the following command:

`crontab -e`

Add the following line to the end of the file:

`* * * * * /usr/bin/node /path/to/cf-iam/index.js`

This will execute **CF-IAM** every minute.

Of course you can modify the cron to your needs and adjust the intervall how you like.


------------

**Note**: Once activated, there is currently to function in place, that automatically de-activates the "**Im under attack mode**" mode when the current active connections have gone under the limit.

This maight be applicable for a future update of **CF-IAM**.

Until then, its up to the site owner, to manually de-activate the "**Im under attack mode**", once it has been activated trough **CF-IAM**.
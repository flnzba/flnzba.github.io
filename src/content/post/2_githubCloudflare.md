---
title: "#2 Github Page Setup"
description: "How to Connect a Github Page to Your Own Domain and Set Up an Email Address with Google Mail and Cloudflare"
publishDate: "24 October 2024"
updatedDate: "24 October 2024"
# coverImage:
#   src: "./cover.png"
#   alt: "Astro build wallpaper"
tags: ["Github", "Cloudflare"]
---

# How to Connect a Github Page to Your Own Domain and Set Up an Email Address

Are you looking to create a website for free? Github Pages is a great way to create and host a website for free. However, if you want to have your own domain and a custom email address, you can connect your Github Pages site to your domain and set up an email address associated with your domain.

## Connecting Your Github Pages Site to Your Domain

Before you can connect your Github Pages site to your domain, you need to have a Github account and a Github Pages site. Once you have created your Github Pages site, you can follow these steps to connect it to your domain:

1. Create a repo on Github.
2. Go to Settings and scroll down to the Github Pages section.
3. Under the Custom domain section, enter your domain name and click Save.
4. Go to your domain registrar and set the CNAME record to your Github Pages site. This will point your domain to your Github Pages site.
5. Wait for the DNS changes to propagate, which can take up to 24-48 hours.
6. Once the DNS changes have propagated, you should be able to see your Github Pages site at your custom domain.

## Setting Up an Email Address Associated with Your Domain

Once you have your custom domain set up, you can set up an email address associated with your domain. Here are the steps to follow:

1. Buy a domain name from a domain registrar such as Namecheap or GoDaddy.
2. Go to your domain registrar and set up MX records for your domain. This will tell email servers where to send emails addressed to your domain.
3. Sign up for a mail service such as Google Workspace or Zoho Mail. Follow the instructions to verify your domain ownership.
4. Once your domain ownership is verified, you can set up an email account and email alias associated with your domain.
5. To access your email, you can use the webmail interface provided by your mail service or you can connect your email account to a mail client like Microsoft Outlook or Apple Mail.

## Connecting Cloudflare Mail to Your Gmail Account

If you want to use your Gmail account to send and receive emails from your custom domain email address, you can connect Cloudflare Mail to your Gmail account. Here are the steps to follow:

1. Sign up for Cloudflare Mail and follow the instructions to verify your domain ownership.
2. In your Gmail account, go to Settings and click on the Accounts and Import tab.
3. Under Send mail as, click on Add another email address and enter your custom domain email address.
4. In the SMTP Server field, enter the Cloudflare Mail SMTP server: [smtp.cloudflaremail.com](http://smtp.cloudflaremail.com/).
5. Enter your Cloudflare Mail username and password and click Add Account.
6. Gmail will send a verification email to your custom domain email address. Follow the instructions to verify your email address.
7. Once your email address is verified, you can send and receive emails from your custom domain email address using your Gmail account.

## Conclusion

Connecting your Github Pages site to your custom domain and setting up an email address associated with your domain can be a bit tricky, but it is definitely worth it if you want to have a more professional online presence. Follow these steps and you should be able to get everything set up in no time!

# How to Connect a Github Page to Your Own Domain and Set Up an Email Address

Github Pages is a great way to create and host a website for free. However, if you want to have your own domain and a custom email address, you can connect your Github Pages site to your domain and set up an email address associated with your domain.

## Connecting Your Github Pages Site to Your Domain

Before you can connect your Github Pages site to your domain, you need to have a Github account and a Github Pages site. Once you have created your Github Pages site, you can follow these steps to connect it to your domain:

1. Buy a domain name from a domain registrar such as Namecheap or GoDaddy.
2. In your Github repository, go to **Settings** and scroll down to the **Github Pages** section.
3. Under the **Custom domain** section, enter your domain name and click **Save**.
4. Go to your domain registrar and set the **CNAME** record to your Github Pages site. This will point your domain to your Github Pages site.
5. Wait for the DNS changes to propagate, which can take up to 24-48 hours.
6. Once the DNS changes have propagated, you should be able to see your Github Pages site at your custom domain.

## Setting Up an Email Address Associated with Your Domain

Once you have your custom domain set up, you can set up an email address associated with your domain. Here are the steps to follow:

1. Go to your domain registrar and set up **MX** records for your domain. This will tell email servers where to send emails addressed to your domain.
2. Sign up for a mail service such as Google Workspace or Zoho Mail. Follow the instructions to verify your domain ownership.
3. Once your domain ownership is verified, you can set up an email account and email alias associated with your domain.
4. To access your email, you can use the webmail interface provided by your mail service or you can connect your email account to a mail client like Microsoft Outlook or Apple Mail.

## Connecting Cloudflare Mail to Your Gmail Account

If you want to use your Gmail account to send and receive emails from your custom domain email address, you can connect Cloudflare Mail to your Gmail account. Here are the steps to follow:

1. Sign up for Cloudflare Mail and follow the instructions to verify your domain ownership.
2. In your Gmail account, go to **Settings** and click on the **Accounts and Import** tab.
3. Under **Send mail as**, click on **Add another email address** and enter your custom domain email address.
4. In the **SMTP Server** field, enter the Cloudflare Mail SMTP server: `smtp.cloudflaremail.com`.
5. Enter your Cloudflare Mail username and password and click **Add Account**.
6. Gmail will send a verification email to your custom domain email address. Follow the instructions to verify your email address.
7. Once your email address is verified, you can send and receive emails from your custom domain email address using your Gmail account.

Link: [Use a basic GMail account to send as it would use a domain with Cloudflare](https://jay.gooby.org/2022/05/06/use-a-basic-gmail-account-to-send-mail-as-with-a-domain-that-uses-cloudflare-email-routing)

## Conclusion

Connecting your Github Pages site to your custom domain and setting up an email address associated with your domain can be a bit tricky, but it is definitely worth it if you want to have a more professional online presence. Follow these steps and you should be able to get everything set up in no time!

### TL;DR
1. Create repo on github
2. settings → Github Pages
3. clone to local or set up codespace
4. push site data to repo
5. see on username.github.io
6. buy domain
7. set domain name in settings
8. change cname properties in domain provider
9. set up MX Records at domain provider
10. set up mail account in google
11. set up mail alias
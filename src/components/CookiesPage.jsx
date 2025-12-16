import React from "react";
import { motion } from "framer-motion";
import Metatags from "../SEO/metatags";

const metaPropsData = {
  title: "Cookies Policy – Privacy & Data Protection at PDF Works",
  description:
    "The Cookies Policy explains how authentication, preference, and analytics cookies are used to enhance your experience with free online PDF tools.",
  keyword:
    "pdf works cookies policy, free pdf tools cookies, privacy policy pdf works, cookie usage free pdf editor, website cookies policy",
  image:
    "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761288318/wn8m8g8skdpl6iz2rwoa.svg",
  url: "https://pdfworks.in/cookies",
};

const CookiesPage = () => {
  return (
    <>
      <Metatags metaProps={metaPropsData} />
      <div className="max-w-4xl mx-auto prose prose-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="gradient-text">Cookies Policy</h1>
          <p className="text-gray-500">Last updated: October 4, 2025</p>

          <h2>What Are Cookies?</h2>
          <p>
            As is common practice with almost all professional websites, this
            site uses cookies, which are tiny files that are downloaded to your
            computer, to improve your experience. This page describes what
            information they gather, how we use it and why we sometimes need to
            store these cookies.
          </p>

          <h2>How We Use Cookies</h2>
          <p>
            We use cookies for a variety of reasons detailed below.
            Unfortunately, in most cases, there are no industry standard options
            for disabling cookies without completely disabling the functionality
            and features they add to this site. It is recommended that you leave
            on all cookies if you are not sure whether you need them or not in
            case they are used to provide a service that you use.
          </p>

          <h2>The Cookies We Set</h2>
          <ul>
            <li>
              <strong>Account related cookies:</strong> If you create an account
              with us then we will use cookies for the management of the signup
              process and general administration. These cookies will usually be
              deleted when you log out however in some cases they may remain
              afterwards to remember your site preferences when logged out.
            </li>
            <li>
              <strong>Login related cookies:</strong> We use cookies when you
              are logged in so that we can remember this fact. This prevents you
              from having to log in every single time you visit a new page.
              These cookies are typically removed or cleared when you log out to
              ensure that you can only access restricted features and areas when
              logged in.
            </li>
            <li>
              <strong>Site preferences cookies:</strong> In order to provide you
              with a great experience on this site, we provide the functionality
              to set your preferences for how this site runs when you use it. In
              order to remember your preferences, we need to set cookies so that
              this information can be called whenever you interact with a page.
            </li>
          </ul>

          <h2>Third-Party Cookies</h2>
          <p>
            In some special cases, we also use cookies provided by trusted third
            parties. For example, this site uses Google Analytics which is one
            of the most widespread and trusted analytics solutions on the web
            for helping us to understand how you use the site and ways that we
            can improve your experience.
          </p>

          <h2>Disabling Cookies</h2>
          <p>
            You can prevent the setting of cookies by adjusting the settings on
            your browser (see your browser Help for how to do this). Be aware
            that disabling cookies will affect the functionality of this and
            many other websites that you visit. Disabling cookies will usually
            result in also disabling certain functionality and features of this
            site. Therefore it is recommended that you do not disable cookies.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default CookiesPage;

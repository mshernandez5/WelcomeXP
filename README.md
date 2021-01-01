# WelcomeXP
A lightdm-webkit2-greeter to mimic the Windows XP login screen.

There is a [*really great Windows XP theme for Cinnamon*](https://github.com/ndwarshuis/CinnXP) which I've been using practically since it existed (thanks, @ndwarshuis).

I found that there seems to be no recent attempts to make a greeter to match it, which is where this project began.

With the help of the lightdm-webkit2-greeter engine, this theme makes an attempt at recreating the XP login screen.

Due to limitations of the webkit engine, things aren't perfect yet.
While the theme renders well in regular browsers, I've found (by *a lot* of trial and error) that a few standard features are not supported by the webkit engine which I have to work around.
Despite this, the theme is still in decent shape rendered by lighdm-webkit2-greeter and is usable.

# Screenshots
Login:

![login](https://user-images.githubusercontent.com/62854710/103432192-108d4680-4b90-11eb-96aa-d64b0740f9ff.png)

Selected User:

![login-select](https://user-images.githubusercontent.com/62854710/103432194-12570a00-4b90-11eb-9c9e-cf748d05fd85.png)

Welcome Screen:

![welcome](https://user-images.githubusercontent.com/62854710/103432195-1420cd80-4b90-11eb-80b0-9ed83e365c71.png)

# Warnings
There are some things you **need** to understand and be aware about before attempting to install this theme:
* If you do not know how to install lightdm-webkit2-greeter and configure it to use this theme then I cannot recommend that you try to install the theme at this early state in case any issues arise. After all, a broken LightDM theme can easily prevent you from graphically logging in to your system. Having said this, I have not encountered any severe issues using the theme myself after working out the initial issues.
* The theme ***does not*** yet support choosing a desktop environment within the login screen! This means that you will have to correctly edit the `index.theme` session setting to match your desktop environment before installing the theme.
* The theme does not give any option to manually enter a username. It will read from the list of known users and display those.

# Notes
I would strongly recommend placing a copy of `tahoma.ttf` (the main font used by XP) and `framd.ttf` (Franklin Medium Gothic, welcome screen font) into the `fonts` directory (create one) before installing to make the screens a little more authentic.
If you have a Windows installation, you can easily grab them from `C:\Windows\Fonts`.

The theme will use your user profile picture, but if you do not have one the dirt bike image will be used by default.

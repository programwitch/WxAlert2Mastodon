# WxAlert2Mastodon

**A project to post Oklahoma Weather Alerts to Mastodon.**

This is one of my rabbit hole projects, meaning I was just curious if I could make it work. Ha!  

This code is provided as-is.  You are free to use it for your own projects.  

If you have any questions, please feel free to ask me at [@blogoklahoma@social.tulsa.ok.us](https://social.tulsa.ok.us/@blogoklahoma).  

## Using

- [Node.js](https://nodejs.org/en)
- [National Weather Service API](https://www.weather.gov/documentation/services-web-api)
- [Mastodon API](https://docs.joinmastodon.org/api/)

## Log
- 06/23/2023 10:32 AM: [Idea on Mastodon](https://social.tulsa.ok.us/@blogoklahoma/110594250928009474)
- 06/23/2023 01:00 PM: Started research and first code to display weather alerts from NWS API
- 06/23/2023 03:30 PM: Posted on Github first part of Javascript code.  (See Javascript version working at [blogoklahoma.com/weather](https://blogoklahoma.com/weather))
- 06/30/2023 09:00 AM: Started Node.js version of code.  
- 07/05/2023 03:27 PM: Posted the latest update of the code. I rewrote it from the previous version. I converted some functions to use Promises. It is running but can be improved on.  I want the Mastodon posting to happen within the processing loop and not asynchronously.
- 07/06/2023 8:11 AM: Moved code from [blogoklahoma/Rabbit Hole/WxAlerts-Node](https://github.com/programwitch/blogoklahoma/tree/main/Rabbit%20Hole%20/WxAlerts-Node) to here.
- 07/06/2023 8:30 AM: Ran a full test overnight.  Worked really well.  And just by chance we had rapidly moving thunderstorms cross the state all night. Ha! Flooded my feed with #okwx updates.   

## Config
To configure, edit the config.json file.  Any changes to this file will require a restart of the app.

- Wx.apiUse: set to "area" or "zone".  Area will do state-wide alerts. Zone will do an individual county 
- Wx.state: set to your state with the standard two-letter U.S. Postal abbreviation. (Example: OK, TX, KS, CA, ...)
- Wx.zone: set to your zone: Lookup here: [Public Zone Maps](https://www.weather.gov/pimar/PubZone)  Set with your state's standard two-letter U.S. Postal abbreviation, "Z", and the zone number. (Example: Tulsa County, Oklahoma is "OKZ060")
- Wx.regions: (An array) set with your NWS service region or regions. This information is used for posting to Mastodon.  Look up here: [www.weather.gov/](https://www.weather.gov/)
    - Wx.regions[].nwsName is the service sender name. It's typically "NWS", City, and State. This is used to lookup, so it needs to match the sender name. (Examples: NWS Norman OK, NWS Shreveport LA)
    - Wx.regions[].nwsUrl is the sender's website. (Examples: https://www.weather.gov/oun/, https://www.weather.gov/shv/)
    - Wx.regions[].shortName is a shorter version of the sender's name.  This is used when posting to Mastodon. (NWS Norman, NWS Shreveport or OUN, SHV)
    - Wx.regions[].note is a note space for you.  I used it to denote coverage area, (Example: NWS Norman OK covers Western Oklahoma)
 
- Mastodon.url is your instance's address (Example: https://social.tulsa.ok.us, https://mastodon.social)
- Mastodon.token is your access token.  You can get this from the Prefernces/Development. click the New Application button to get it.  Friendly reminder: Don't share it.
- Mastodon.postSize is your post limit.  I belive the default is 500 characters, but your instance may set it larger.  The limit should be visible in the bottom corner fo the post form. 
- Mastodon.postLead is your post leader (front of post).  I set mine to our state's weather hashtag (okwx).  Note: State + "WX" has been accepted as the standard weather hastag.
- Mastodon.posting lets you turn off Mastodon posting.  You can use this if you want to test all your Wx settings before sending to Mastodon.

 

